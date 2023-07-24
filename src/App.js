import './App.css';
import React, { useState, useRef } from 'react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [points, setPoints] = useState([]);
  const scaleRef = useRef(null);
  const traceRef = useRef(null); 
  const outputRef = useRef(null);  
  const [savedPoints, setSavedPoints] = useState(null);
  const [inputValues, setInputValues] = useState({
    suture_width: '',
    length: ''
  })

  const [tracePoints, setTracePoints] = useState([]);
  const [savedTrace, setSavedTrace] = useState(null);

  const [insertionPoints, setInsertionPoints] = useState([]);
  const [centerPoints, setCenterPoints] = useState([]);
  const [extractionPoints, setExtractionPoints] = useState([]);

  const handleScaleInputChange = (event) => {
    const { name, value } = event.target;
    setInputValues((prevFormData) => ({
      ...prevFormData,
      [name]: value
    }));
  }

  const handleFormSubmit = (event) => {
    event.preventDefault();

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

  const handleImageClick = (event, isTracing) => {
    let top, left;
    if (isTracing) {
      ({ top, left } = traceRef.current.getBoundingClientRect());
    } else {
      ({ top, left } = scaleRef.current.getBoundingClientRect());
    }
    
    const { clientX, clientY, pageX, pageY } = event;
    const newPoint = {
      x: pageX - left - window.scrollX,
      y: pageY - top - window.scrollY,
      displayX: clientX + window.scrollX,
      displayY: clientY + window.scrollY
    };

    if (isTracing) {
      setTracePoints((prevPoints) => [...prevPoints, newPoint]);
    } else {
      if (points.length < 2) {
        setPoints((prevPoints) => [...prevPoints, newPoint]);
      } else {
        setPoints((prevPoints) => [prevPoints[1], newPoint]);
      }
    }
  };

  const handleSavePoints = () => {
    setSavedPoints([...points]);

  };

  const handleSaveTrace = async () => {
    setSavedTrace([...tracePoints]);

    try {

      const requestData = {
        scaleValues: inputValues,
        savedPoints: savedPoints,
        tracePoints: tracePoints
      };
      const response = await fetch('http://localhost:8000/get_wound_parameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('Response:', data);

      // process response - need to get the scroll and set output points accordingly
      let top, left;
      ({ top, left } = outputRef.current.getBoundingClientRect())

      console.log(top);

      const convertToPoint = (point) => {
        const newPoint = {
          x: point[0],
          y: point[1],
          displayX: point[0] + left + window.scrollX,
          displayY: point[1] + top + window.scrollY
        };

        return newPoint;
      }

      let insertPointData = data['insertion_points'].map(convertToPoint);
      let extractPointData = data['extraction_points'].map(convertToPoint);
      let centerPointData = data['center_points'].map(convertToPoint);

      console.log(insertPointData)

      setCenterPoints([...centerPointData])
      setInsertionPoints([...insertPointData])
      setExtractionPoints([...extractPointData])

    } catch (error) {
      console.error('Error:', error);
    }
    
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

      <div className='container'>
        <div className='Clicking-div' ref={scaleRef}>
          {
            selectedImage && <img 
              src={selectedImage} 
              alt="Selected Image" 
              style={{ width: '1000px', height: 'auto' }}
              onClick={(event) => handleImageClick(event, false)}
            />
          }
          {points.map((point, index) => (
              <div
                key={index}
                className="point"
                style={{ left: point.displayX, top: point.displayY}}
              />
            ))
          }
        </div>

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
          name='length'
          value={inputValues.length}
          onChange={handleScaleInputChange}
          placeholder="point dist (mm)"
        />
        <br />
        <input
          type="number"
          name='suture_width'
          value={inputValues.suture_width}
          onChange={handleScaleInputChange}
          placeholder="suture width (mm)"
        />
        <br />
        <button type="submit">Submit</button>
      </form>
      {inputValues.length && <p>Length: {inputValues.length}</p>}
      {inputValues.suture_width && <p>Suture Width: {inputValues.suture_width}</p>}

      <h1>Trace Suture</h1>
      <div className='container'>
        <div className='Clicking-div' ref={traceRef}>
          {
            selectedImage && <img 
              src={selectedImage} 
              alt="Selected" 
              style={{ width: '1000px', height: 'auto' }}
              onClick={(event) => handleImageClick(event, true)}
            />
          }
          {tracePoints.map((point, index) => (
              <div
                key={index}
                className="point"
                style={{ left: point.displayX, top: point.displayY}}
              />
            ))
          }
        </div>
      </div>
      <button onClick={handleSaveTrace}>Done</button>
      {savedTrace && (
        <div>
          <h2>Saved Trace Points:</h2>
          <ul>
            {savedTrace.map((point, index) => (
              <li key={index}>
                Point {index + 1}: ({point.x}, {point.y})
              </li>
            ))}
          </ul>
        </div>
      )}

      <h1> Results </h1>
      <div className='container'>
        <div className='Output-div' ref={outputRef}>
          {
            selectedImage && <img 
              src={selectedImage} 
              alt="Selected Image" 
              style={{ width: '1000px', height: 'auto' }}
            />
          }
          {centerPoints.map((point, index) => (
              <div
                key={index}
                className="green_point"
                style={{ left: point.displayX, top: point.displayY}}
              />
            ))
          }

          {insertionPoints.map((point, index) => (
              <div
                key={index}
                className="blue_point"
                style={{ left: point.displayX, top: point.displayY}}
              />
            ))
          }

          {extractionPoints.map((point, index) => (
              <div
                key={index}
                className="point"
                style={{ left: point.displayX, top: point.displayY}}
              />
            ))
          }

        </div>

      </div>
    </>
  );
}

export default App;
