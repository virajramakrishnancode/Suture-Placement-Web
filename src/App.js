import './App.css';
import React, { useState, useRef } from 'react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [points, setPoints] = useState([]);
  const scaleRef = useRef(null);
  const traceRef = useRef(null); 
  const outputRef = useRef(null);  

  const [tracePoints, setTracePoints] = useState([]);
  const [savedTrace, setSavedTrace] = useState(null);

  const [insertionPoints, setInsertionPoints] = useState([]);
  const [centerPoints, setCenterPoints] = useState([]);
  const [extractionPoints, setExtractionPoints] = useState([]);

  const [sliderValue, setSliderValue] = useState(5);

  const [sutureWidth, setSutureWidth] = useState(0);
  const [idealDist, setIdealDist] = useState(50);

  // code for dragging scale disk

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const circleRef = useRef();

  const handleMouseDown = (event) => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;

    const { clientX, clientY } = event;
    const circleRect = circleRef.current.getBoundingClientRect();

    const offsetX = clientX - circleRect.left;
    const offsetY = clientY - circleRect.top;

    setPosition({ x: offsetX, y: offsetY });
  };

  const handleIdealDist = (event) => {
    setIdealDist(parseInt(event.target.value));
  };

  const handleSutureWidth = (event) => {
    setSutureWidth(parseInt(event.target.value))
  }

  const handleSliderChange = (event) => {
    setSliderValue(parseInt(event.target.value));
  };

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

  const handleSaveTrace = async () => {
    setSavedTrace([...tracePoints]);

    try {

      const requestData = {
        sutureWidth: sutureWidth,
        idealDist: idealDist,
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
        Please resize and drag the disk so that its diameter is ideally how far away two sutures should be!
      </p>

      <div className='container'>
        <div className='Clicking-div' ref={scaleRef}>
          {
            selectedImage && <img 
              src={selectedImage} 
              alt="Selected Image" 
              style={{ width: '1000px', height: 'auto' }}
            />
          }
          {
            selectedImage && <div
            className="circle"
            ref={circleRef}
            draggable='true'
            style={{ height: idealDist, width: idealDist, top: "50%", left: "50%"}}
          />
          }
        </div>
      </div>

      <div>
        <div className='flex-item'>
          <input
              type="range"
              min="50"
              max="300"
              value={idealDist}
              onChange={handleIdealDist}
            />
        </div>
        <div className='flex-item'>Circle size</div>

      </div>

      <h1>Scale Info</h1>
      <div>
        <input
            type="range"
            min="0"
            max="10"
            value={sutureWidth}
            onChange={handleSutureWidth}
          />
        <p>Suture Width (mm): {sutureWidth}</p>
      </div>

      <h1>Trace Suture</h1>
      <div className='container'>
        <div 
          className='Clicking-div' 
          ref={traceRef}
        >
          {
            selectedImage && <img 
              src={selectedImage} 
              alt="Selected" 
              style={{ width: '1000px', height: 'auto' }}
              onClick={(event) => handleImageClick(event, true)}
            />
          }
          
          <div>
            <h2>Trace Points:</h2>
            <ul>
              {tracePoints.map((point, index) => (
                <li key={index}>
                  Point {index + 1}: ({point.x}, {point.y})
                </li>
              ))}
            </ul>
          </div>
        </div>

        {tracePoints.map((point, index) => (
              <div
                key={index}
                className="point"
                style={{ left: point.displayX, top: point.displayY}}
              />
            ))
          }
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
