import './App.css';
import React, { useState, useRef, useEffect } from 'react';
import active from './images/active.svg';
import done from './images/done.svg';
import inactive from './images/inactive.svg';
import upload from './images/upload.svg';
import angleIcon from './images/angle-icon.svg';
import { ThemeContext } from '@mui/styled-engine';
import { Stage, Layer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

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
    scaleSuture : 3, 
    process : 4, 
    results : 5
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
    scaleSuture : {
      name : "Scale Suture",
      desc : "Show us how long an example suture should be.",
      body : (<><img id="task1" width="24px" src={active} alt="" /> <strong>Click</strong> a spot you might start a suture.<br/>
      <img id="task2" width="24px" src={active} alt="" /> <strong>Click</strong> a spot you might end that suture.<br/></>)
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
        <div className="vertical" style={{left:"22px", top:"16px", zIndex:"-1"}}></div>
        <h2 id="majorTask1"><img onClick={composeStateSet("uploadImage")} width="24px"  src={{1 : active,   2 : done,     3: done,      4: done,        5: done}[stepToOrder[panel]]} alt="" /> Upload Image</h2><br/>
        <h2 id="majorTask2"><img onClick={composeStateSet("locateWound")} width="24px"  src={{1 : inactive, 2 : active,   3: done,      4: done,        5: done}[stepToOrder[panel]]} alt="" /> Locate Wound</h2><br/>
        <h2 id="majorTask3"><img onClick={composeStateSet("scaleSuture")} width="24px"  src={{1 : inactive, 2 : inactive, 3: active,    4: done,        5: done}[stepToOrder[panel]]} alt="" /> Scale Suture</h2><br/>
        <h2 id="majorTask4"><img onClick={composeStateSet("process")} width="24px"      src={{1 : inactive, 2 : inactive, 3: inactive,  4: active,      5: done}[stepToOrder[panel]]} alt="" /> Process</h2><br/>
        <h2 id="majorTask5"><img onClick={composeStateSet("results")} width="24px"      src={{1 : inactive, 2 : inactive, 3: inactive,  4: inactive,    5: done}[stepToOrder[panel]]} alt="" /> Results</h2><br/>
      </div>
    </div></>)
  };

  var stage
  var layer
  var imageDisplayWidth = 1385
  var imageDisplayHeight = 1080
  function prepStageAndLayer() {
    stage = new Konva.Stage({
      container: 'testRealm',
      width: imageDisplayWidth,
      height: imageDisplayHeight
    });
    layer = new Konva.Layer();
    stage.add(layer);
    stage.draw();
  }

  function mainAreaContentsFor(panel) {
    return {
      "uploadImage":
        (<div className="uploadImagePanel" id="uploadImagePanel"> 
          <label for="imgUpload"><img width="24px" src={upload} alt="" />Upload Image</label>      
          <input id="imgUpload" type="file" accept="image/*" style={{zIndex:"10"}} onChange={handleImageUpload} />
        </div>),
      "locateWound":
        (<div className="locateWoundPanel" id="locateWoundPanel"> 
        </div>),
      "scaleSuture":
        (<div className="scaleSuturePanel" id="scaleSuturePanel"> 
        </div>),
      "process":
        (<div className="processPanel" id="processPanel"> 
        </div>),
      "results":
        (<div className="resultsPanel" id="resultsPanel"> 
        </div>),
    }[panel]
  };

  // The start and end coordinates of the rectangle, in pixels
  // Adds a few pixels extra just in case of scaling weirdness which can happen sometimes
  // TODO: Prevent OOB returns (like under 0 or above img size)
  const extrapolateRectPos = (imagePos, rectPos, rectSize, imageScale) => {
    var rectOffset = {x: rectPos.x - imagePos.x, y: rectPos.y - imagePos.y} // Difference between rect's pos and image's pos.
    var scaledOffset = {x: rectOffset.x / imageScale.x, y: rectOffset.y / imageScale.y} // Rect's position on actual image.
    var scaledRectSize = {x: rectSize.width / imageScale.x, y: rectSize.height / imageScale.y}
    return {x: scaledOffset.x - 15, y: scaledOffset.y - 15, w: scaledRectSize.x + 30, h: scaledRectSize.y + 30}
  }

  const addSizingRect = () => {
    var handle = new Konva.Circle({
      draggable: true,
      radius: 20,
      fill: '#4100A3',
      opacity: 0.8,
      stroke: 'black',
      strokeWidth: 2,
    })
    var rect = new Konva.Rect({
      draggable: true,
      fill: '#4100A3',
      opacity: 0.2,
      stroke: 'black',
      strokeWidth: 2,
      width: 400,
      height: 400
    });

    var scaleIcon;
    var imageObj = new Image();
    imageObj.onload = function() {
      scaleIcon = new Konva.Image({
        image: imageObj,
        width: 22,
        height: 22,
        listening: false
      });
      layer.add(scaleIcon);
      layer.draw();
      enforceHandlePos()
    }
    imageObj.src = require('./images/scale.png');

    // Updates position of handle and its icon.
    // There's probably some kind of grouping / container stuff that we can do to update the icon's position automatically.
    const enforceHandlePos = () => {
      handle.x(rect.x() + rect.width());
      handle.y(rect.y() + rect.height());
      if (imageObj.complete && scaleIcon) {
        scaleIcon.x(rect.x() + rect.width() - 10);
        scaleIcon.y(rect.y() + rect.height() - 10);
      }
    };

    rect.on('dragmove', (e) => {
      enforceHandlePos();
    });

    handle.on('dragmove', (e) => {
      // Resize rect
      var minWidth = 50;
      var minHeight = 50;
      var targetWidth = handle.x() - rect.x();
      var targetHeight = handle.y() - rect.y();
      rect.width(Math.max(minWidth, targetWidth));
      rect.height(Math.max(minHeight, targetHeight));

      // Enforce handle position
      enforceHandlePos();
    });

    // Light up on hover.
    rect.on('mouseover', () => {
      rect.fill("#8433ff");
    });
    rect.on('mouseout', () => {
      rect.fill("#4100A3");
    });
    handle.on('mouseover', () => {
      handle.fill("#8433ff");
    });
    handle.on('mouseout', () => {
      handle.fill("#4100A3");
    });

    handle.on('wheel', (e) => {
      console.log("FastSAM Rect Data:", extrapolateRectPos(imageComponent.position(), rect.position(), rect.size(), imageComponent.scale()))
    });

    layer.add(rect);
    layer.add(handle);

    enforceHandlePos();

    layer.draw();
  }

  var imageComponent
  const handleImageUpload = (event) => {
    prepStageAndLayer()

    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(event.target.files[0]);
    var img = new Image();
    img.src = url;

    // edit this stuff
    img.onload = function() {
      var width = img.width;
      var height = img.height;

      var maxDimension = 1000;
      var ratio = width > height ? (width / maxDimension) : (height / maxDimension)

      // now load the Konva image
      imageComponent = new Konva.Image({
        draggable: true,
        width: width/ratio,
        height: height/ratio,
        image: img,
        x: 50,
        y: 50
      });

      const enforceVisibility = () => {
        var minVisible = 400 // Minimum visible pix in each direction.
        imageComponent.y(Math.max(imageComponent.y(), imageComponent.height() * imageComponent.scale().y * -1 + minVisible))
        imageComponent.x(Math.max(imageComponent.x(), imageComponent.width() *  imageComponent.scale().x * -1 + minVisible))

        imageComponent.y(Math.min(imageComponent.y(), imageDisplayHeight - minVisible))
        imageComponent.x(Math.min(imageComponent.x(), imageDisplayWidth - minVisible))
      }

      imageComponent.on('dragmove', () => {
        enforceVisibility();
      });
      imageComponent.on('wheel', (e) => {
        // Rescale.
        var currentScale = imageComponent.scale();

        var minScale = 0.5;
        var maxScale = 2.5;
        var changeRate = -0.0005
        var change = e.evt.deltaY * changeRate;

        var targetScale = Math.min(Math.max(currentScale.x + change, minScale), maxScale);
        if (targetScale == currentScale.x) {
          return;
        }

        imageComponent.scale({x: targetScale, y: targetScale});
        
        // Change position so it scales from center.
        var diffX = change * -0.5 * imageComponent.width();
        var diffY = change * -0.5 * imageComponent.height();
        imageComponent.x(imageComponent.x() + diffX);
        imageComponent.y(imageComponent.y() + diffY);

        enforceVisibility();
      })

      layer.add(imageComponent);
      layer.draw();

      addSizingRect();

      setActivePanel("locateWound");
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

        <div id="testRealm" style={{position:"absolute", left:"535px"}}>

        </div>

      </div>
    </>
  );
}

export default App;
