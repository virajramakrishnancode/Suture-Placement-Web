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
import { render } from '@testing-library/react';

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

  const [savedImage, setSavedImage] = useState(null);

  const recordedRectPos = useRef({x:0, y:0, w:0, h:0});

  const point1Pos = useRef({x:0, y:0});
  const point2Pos = useRef({x:0, y:0});
  const finalPoints = useRef(null);

  const activeImage = useRef(null);

  const stageRef = useRef(null);
  const layerRef = useRef(null);

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
      <img id="task2" width="24px" src={inactive} alt="" /> <strong>Confirm</strong> your selection.<br/>
      <button onClick={composeStateSet("scaleSuture")}><strong>Confirm Rectangle</strong></button></>) // onclick goes here
    }, 
    scaleSuture : {
      name : "Scale Suture",
      desc : "Show us how long an example suture should be.",
      body : (<><img id="task1" width="24px" src={active} alt="" /> <strong>Click</strong> a spot you might start a suture.<br/>
      <img id="task2" width="24px" src={inactive} alt="" /> <strong>Click</strong> a spot you might end that suture.<br/>
      <button onClick={composeStateSet("process")}><strong>Confirm Scaling</strong></button></>)
    },
    process : {
      name : "Processing",
      desc : "We're processing your image. Give us a moment.",
      body : (<><img id="task1" width="24px" src={active} alt="" /> <strong>Wait</strong> while we find a good suture plan.</>)
    }, 
    results : {
      name : "Results",
      desc : "All done! You can view the suture plan on the right.",
      body : (<><h3><img width="24px" src={angleIcon} alt="" onClick={handleExport}/> Save as .jpg</h3><br/>
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

  var imageDisplayWidth = 1385
  var imageDisplayHeight = 1080

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
    return {x: scaledOffset.x, y: scaledOffset.y, w: scaledRectSize.x, h: scaledRectSize.y}
  }

  // TODO This needs to change based on image scale.
  const extrapolateSutureLength = () => {
    let xDiff = point1Pos.current.x - point2Pos.current.x;
    let yDiff = point1Pos.current.y - point2Pos.current.y;
    return Math.hypot(xDiff, yDiff);
  }

  function wipeLayer() {
    layerRef.current.destroyChildren();
  }

  function renderPointAt(x, y, color) {
    let newPoint = new Konva.Circle({
      x: x,
      y: y,
      radius: 5,
      fill: color
    })
    layerRef.current.add(newPoint)
    stageRef.current.draw()
  }

  async function fetchPoints() {
    finalPoints.current = await getResultPointsFor(recordedRectPos.current, extrapolateSutureLength(), savedImage.name);
  }

  function showFinalResult() {
    wipeLayer();

    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(savedImage);
    setSavedImage(savedImage)
    var img = new Image();
    // edit this stuff
    img.onload = async function() {
      console.log("Image has loaded.")
      var width = img.width;
      var height = img.height;

      // now load the Konva image
      activeImage.current = new Konva.Image({
        draggable: false,
        width: width,
        height: height,
        image: img,
        x: 50,
        y: 50
      });

      var centerPoints = finalPoints.current[0]
      var insertPoints = finalPoints.current[1]
      var extractPoints = finalPoints.current[2]

      console.log("Points are:", centerPoints, insertPoints, extractPoints)
      
      for (const point of insertPoints) {
        renderPointAt(point[1] + 50, point[0] + 50, 'green') // TODO remove these 50s for the real offset
      }
      for (const point of extractPoints) {
        renderPointAt(point[1] + 50, point[0] + 50, 'red')
      }
      for (const point of centerPoints) {
        renderPointAt(point[1] + 50, point[0] + 50, 'blue')
      }

      layerRef.current.add(activeImage.current)
      activeImage.current.zIndex(0)
      stageRef.current.draw()
    }
    img.src = url;
  }

  async function getResultPointsFor(rectData, sutureLength, imgPath) {
    const requestData = {
      rectData: rectData,
      sutureLength: sutureLength,
      imgPath: imgPath
    };
    const response = await fetch('http://localhost:5000/get_suture_placement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    console.log('Response:', response);
    const data = await response.json();
    console.log('Response Data:', data);
    return data
  }

  function addClickableArea() {  
    wipeLayer()

    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(savedImage);
    setSavedImage(savedImage)
    var img = new Image();
    // edit this stuff
    img.onload = function() {
      var width = img.width;
      var height = img.height;

      // now load the Konva image
      activeImage.current = new Konva.Image({
        draggable: true,
        width: width,
        height: height,
        image: img,
        x: 50,
        y: 50
      });
      activeImage.current.on("click", (e) =>{
        renderPointAt(e.evt.layerX, e.evt.layerY, 'red')

        console.log(point1Pos.current)
        if (point1Pos.current.x == 0) { // TODO have a better way of checking if not set, also let people replace points if they miss
          point1Pos.current = {x: e.evt.layerX, y: e.evt.layerY}
          console.log("Scaling Point 1 @ ", e.evt.layerX, e.evt.layerY)
        } else {
          point2Pos.current = {x: e.evt.layerX, y: e.evt.layerY}
          console.log("Scaling Point 2 @ ", e.evt.layerX, e.evt.layerY)
        }
      });
      layerRef.current.add(activeImage.current)
      activeImage.current.zIndex(1)
      stageRef.current.draw()
    }
    img.src = url;
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
    let sizingRect = new Konva.Rect({
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

      console.log(imageObj)
      layerRef.current.add(scaleIcon);
      enforceHandlePos()
      console.log(stageRef)
      stageRef.current.draw();  
    }
    imageObj.src = require('./images/scale.png');

    // Updates position of handle and its icon.
    // There's probably some kind of grouping / container stuff that we can do to update the icon's position automatically.
    const enforceHandlePos = () => {
      handle.x(sizingRect.x() + sizingRect.width());
      handle.y(sizingRect.y() + sizingRect.height());
      if (imageObj.complete && scaleIcon) {
        scaleIcon.x(sizingRect.x() + sizingRect.width() - 10);
        scaleIcon.y(sizingRect.y() + sizingRect.height() - 10);
      }
    };

    sizingRect.on('dragmove', (e) => {
      enforceHandlePos();
    });

    handle.on('dragmove', (e) => {
      // Resize rect
      var minWidth = 50;
      var minHeight = 50;
      var targetWidth = handle.x() - sizingRect.x();
      var targetHeight = handle.y() - sizingRect.y();
      sizingRect.width(Math.max(minWidth, targetWidth));
      sizingRect.height(Math.max(minHeight, targetHeight));

      // Enforce handle position
      enforceHandlePos();
    });

    // Light up on hover.
    sizingRect.on('mouseover', () => {
      sizingRect.fill("#8433ff");
    });
    sizingRect.on('mouseout', (e) => {
      sizingRect.fill("#4100A3");
      recordedRectPos.current = extrapolateRectPos(activeImage.current.position(), sizingRect.position(), sizingRect.size(), activeImage.current.scale());
    });
    handle.on('mouseover', () => {
      handle.fill("#8433ff");
    });
    handle.on('mouseout', () => {
      handle.fill("#4100A3");
      recordedRectPos.current = extrapolateRectPos(activeImage.current.position(), sizingRect.position(), sizingRect.size(), activeImage.current.scale());
    });

    layerRef.current.add(sizingRect);
    layerRef.current.add(handle);

    enforceHandlePos();

    stageRef.current.draw();
  }

  const handleImageUpload = (event) => {
    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(event.target.files[0]);
    setSavedImage(event.target.files[0])
    var img = new Image();
    img.src = url;

    // edit this stuff
    img.onload = function() {
      var width = img.width;
      var height = img.height;

      // now load the Konva image
      activeImage.current = new Konva.Image({
        draggable: true,
        width: width,
        height: height,
        image: img,
        x: 50,
        y: 50
      });

      const enforceVisibility = () => {
        var minVisible = 400 // Minimum visible pix in each direction.
        activeImage.current.y(Math.max(activeImage.current.y(), activeImage.current.height() * activeImage.current.scale().y * -1 + minVisible))
        activeImage.current.x(Math.max(activeImage.current.x(), activeImage.current.width() *  activeImage.current.scale().x * -1 + minVisible))

        activeImage.current.y(Math.min(activeImage.current.y(), imageDisplayHeight - minVisible))
        activeImage.current.x(Math.min(activeImage.current.x(), imageDisplayWidth - minVisible))
      }

      activeImage.current.on('dragmove', () => {
        enforceVisibility();
      });
      activeImage.current.on('wheel', (e) => {
        // Rescale.
        var currentScale = activeImage.current.scale();

        var minScale = 0.5;
        var maxScale = 2.5;
        var changeRate = -0.0005
        var change = e.evt.deltaY * changeRate;

        var targetScale = Math.min(Math.max(currentScale.x + change, minScale), maxScale);
        if (targetScale == currentScale.x) {
          return;
        }

        activeImage.current.scale({x: targetScale, y: targetScale});
        
        // Change position so it scales from center.
        var diffX = change * -0.5 * activeImage.current.width();
        var diffY = change * -0.5 * activeImage.current.height();
        activeImage.current.x(activeImage.current.x() + diffX);
        activeImage.current.y(activeImage.current.y() + diffY);

        enforceVisibility();
      })

      layerRef.current.add(activeImage.current);
      stageRef.current.draw();

      addSizingRect();

      changePanel("locateWound");
    }
  };

  async function changePanel(toState) {
    setActivePanel(toState)
    if (toState == "scaleSuture") {
      addClickableArea()
    }
    if (toState == "process") {
      await fetchPoints()
      console.log("Results are in!")
      changePanel("results")
    }
    if (toState == "results") {
      showFinalResult()
      console.log("Showing final results.")
    }
  }

  // PICKUP POINT: Move this into the above function so we can call showFinalResult when updating the active panel
  function composeStateSet(toState) {
    return async function() {
      await changePanel(toState)
    }
  }

  // function from https://stackoverflow.com/a/15832662/512042
  function downloadURI(uri, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // function from https://konvajs.org/docs/react/Canvas_Export.html
  function handleExport() {
    console.log(stageRef.current)
    const uri = stageRef.current.toDataURL();
    console.log(uri);
    downloadURI(uri, 'stage.png');
  };

  const [showCover, setShowCover] = useState(true);
  function prepareStage() {
    console.log("Page has loaded.")

    var newStage = new Konva.Stage({
      container: 'mainCanvas',
      width: imageDisplayWidth,
      height: imageDisplayHeight
    });
    var newLayer = new Konva.Layer();

    stageRef.current = newStage
    stageRef.current.add(newLayer);
    layerRef.current = newLayer;

    setShowCover(false);
  }

  return (
    <>
      { showCover ? <div className="cover_panel">
        <button onClick={prepareStage}>Press</button>
      </div> : null }
      <div className="body" style={{ width : '1920px', height:'1080px'}}>
        <div className="sideinfo">
          {sidebarContentsFor(activePanel)}
        </div>

        <div className="main">
          {mainAreaContentsFor(activePanel)}
        </div>

        <div id="mainCanvas" style={{position:"absolute", left:"535px"}}>
        </div>

      </div>
    </>
  );
}

export default App;
