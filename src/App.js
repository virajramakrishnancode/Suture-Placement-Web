import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import active from './images/active.svg';
import done from './images/done.svg';
import inactive from './images/inactive.svg';
import upload from './images/upload.svg';
import angleIcon from './images/angle-icon.svg';
import { ThemeContext } from '@mui/styled-engine';

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

  const [activePanel, setActivePanel] = useState("uploadImage") // uploadImage, locateWound, process, results
  const [taskNumber, setTaskNumber] = useState(1) // The task currently being done. 1 or 2 right now.

  const handleScaleInputChange = (event) => {
    const { name, value } = event.target;
    setInputValues((prevFormData) => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

  };

  const stepToOrder = {
    uploadImage : 1, 
    locateWound : 2, 
    process : 3, 
    results : 4
  };

  const stepToInfo = {
    uploadImage : {
      name : "Upload Image",
      desc : "Upload an image of a wound. Make sure the whole wound is visible.",
      body : (<><img id="task1" width="24px" src={active} alt="" /> <strong>Upload</strong> an image of a wound.</>)
    }, 
    locateWound : {
      name : "Locate Wound",
      desc : "Help us find the wound you plan to suture.",
      body : (<><img id="task1" width="24px" src={active} alt="" /> <strong>Select</strong> a rectangle around the target wound.<br/>
      <img id="task2" width="24px" src={active} alt="" /> <strong>Confirm</strong> your selection.</>)
    }, 
    process : {
      name : "Processing",
      desc : "We're processing your image. Give us a moment.",
      body : (<><img id="task1" width="24px" src={active} alt="" /> <strong>Wait</strong> just a moment while we find a good suture plan.</>)
    }, 
    results : {
      name : "Results",
      desc : "All done! You can view the suture plan on the right.",
      body : (<><h3><img width="24px" src={angleIcon} alt="" /> Save as .jpg</h3><br/>
      <h3><img width="24px" src={angleIcon} alt="" /> Restart</h3><br/>
      <h3><img width="24px" src={angleIcon} alt="" /> Give Feedback</h3><br/></>)
    }
  };

  function sidebarContentsFor(panel) {
    return (<><h1>
      {stepToInfo[panel].name}
    </h1>
    <div className="helperText" style={{marginBottom:"49px"}}>
      {stepToInfo[panel].desc}
    </div>
    <div id="taskText" className="taskText">
      {stepToInfo[panel].body}
    </div>
    <div className="bottomArea">
      <div className="bottomAreaContent" style={{marginLeft:"11px", marginTop:"4px"}}>
        <div className="vertical" style={{left:"22px", top:"13px", zIndex:"-1"}}></div>
        <h2 id="majorTask1"><img onClick={composeStateSet("uploadImage")} width="24px" src={{1 : active,   2 : done,     3: done,      4: done}[stepToOrder[panel]]} alt="" /> Upload Image</h2><br/>
        <h2 id="majorTask2"><img onClick={composeStateSet("locateWound")} width="24px" src={{1 : inactive, 2 : active,   3: done,      4: done}[stepToOrder[panel]]} alt="" /> Locate Wound</h2><br/>
        <h2 id="majorTask3"><img onClick={composeStateSet("process")} width="24px" src={{1 : inactive, 2 : inactive, 3: active,    4: done}[stepToOrder[panel]]} alt="" /> Process</h2><br/>
        <h2 id="majorTask4"><img onClick={composeStateSet("results")} width="24px" src={{1 : inactive, 2 : inactive, 3: inactive,  4: done}[stepToOrder[panel]]} alt="" /> Results</h2><br/>
      </div>
    </div></>)
  };

  function mainAreaContentsFor(panel) {
    return {
      "uploadImage":
        (<div className="uploadImagePanel" id="uploadImagePanel"> 
          <label for="imgUpload"><img width="24px" src={upload} alt="" />Upload Image</label>      
          <input id="imgUpload" type="file" accept="image/*" style={{zIndex:"10"}} onChange={handleImageUpload} />
        </div>),
      "locateWound":
        (<div className="locateWoundPanel" id="locateWoundPanel"> 
        {
          selectedImage && 
          <img 
            src={selectedImage}
            alt="Selected"
            style={{ width: '1000px', height: 'auto' }}
            onClick={(event) => handleImageClick(event, true)}
          />
        }
        </div>),
      "process":
        (<div className="processPanel" id="processPanel"> 
        </div>),
      "results":
        (<div className="resultsPanel" id="resultsPanel"> 
        </div>),
    }[panel]
  };
  

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      setSelectedImage(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
      setActivePanel("locateWound")
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

  function composeStateSet(toState) {
    return function() {
      setActivePanel(toState)
    }
  }

  return (
    <>
      <div className="body" style={{ width : '1920px', height:'1080px'}}>
        <div className="sideinfo">
          {sidebarContentsFor(activePanel)}
        </div>

        <div className="main">
          {mainAreaContentsFor(activePanel)}
        </div>

        {/* Old stuff. Don't use. */}
        <div className="old" style={{display:"none"}}>
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
      </div>
    </>
  );
}

export default App;
