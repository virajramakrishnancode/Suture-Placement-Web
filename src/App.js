import './App.css';
import React, { useState, useRef } from 'react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [points, setPoints] = useState([]);
  const imageRef = useRef(null);
  const [savedPoints, setSavedPoints] = useState(null);
  const [inputValue1, setInputValue1] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [submittedValue1, setSubmittedValue1] = useState('');
  const [submittedValue2, setSubmittedValue2] = useState('');

  const handleInputChange1 = (event) => {
    setInputValue1(event.target.value);
  };

  const handleInputChange2 = (event) => {
    setInputValue2(event.target.value);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    setSubmittedValue1(parseFloat(inputValue1));
    setSubmittedValue2(parseFloat(inputValue2));

    setInputValue1('');
    setInputValue2('');
  };


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      setSelectedImage(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (event) => {
    const { top: containerTop, left: containerLeft } = imageRef.current.getBoundingClientRect();
    const { clientX, clientY } = event;
    const newPoint = {
      x: clientX - containerLeft,
      y: clientY - containerTop,
      displayX: clientX + window.scrollX,
      displayY: clientY + window.scrollY
    };

    if (points.length < 2) {
      setPoints((prevPoints) => [...prevPoints, newPoint]);
    } else {
      setPoints((prevPoints) => [prevPoints[1], newPoint]);
    }
  };

  const handleSavePoints = () => {
    setSavedPoints([...points]);
  };

  return (
    <>
      <div className="App">
        <header className="App-header">
          <p>
            Suture Placement
          </p>
        </header>
      </div>
      <div>
        <h1>Image Upload</h1>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>
      
      <h1>
        Scale Measurement
      </h1>
      <p>
        Please click two points a known distance apart!
      </p>

      <div className='Clicking-div' ref={imageRef}>
        {
          selectedImage && <img 
            src={selectedImage} 
            alt="Selected Image" 
            style={{ width: '1000px', height: 'auto' }}
            onClick={handleImageClick}
          />
        }
        {points.map((point, index) => (
            <div
              key={index}
              className="point"
              style={{ left: point.displayX, top: point.displayY}}
            />
          ))}
      </div>
      {points.length > 0 && (
        <div>
          <p>Point 1: ({points[0].x}, {points[0].y})</p>
          {points.length === 2 && (
            <p>Point 2: ({points[1].x}, {points[1].y})</p>
          )}
        </div>
      )}
      <button onClick={handleSavePoints}>Done</button>
      {savedPoints && (
        <div>
          <h2>Saved Points:</h2>
          <ul>
            {savedPoints.map((point, index) => (
              <li key={index}>
                Point {index + 1}: ({point.x}, {point.y})
              </li>
            ))}
          </ul>
        </div>
      )}

      <h1>Scale Info</h1>
      <form onSubmit={handleFormSubmit}>
        <input
          type="number"
          value={inputValue1}
          onChange={handleInputChange1}
          placeholder="point dist (mm)"
        />
        <br />
        <input
          type="number"
          value={inputValue2}
          onChange={handleInputChange2}
          placeholder="suture width (mm)"
        />
        <br />
        <button type="submit">Submit</button>
      </form>
      {submittedValue1 && <p>Value 1: {submittedValue1}</p>}
      {submittedValue2 && <p>Value 2: {submittedValue2}</p>}
    </>
     
  );
}

export default App;
