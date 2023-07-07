import './App.css';
import React, { useState } from 'react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);

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
    <div className='Clicking-div'>
      <h1>
        Scale Measurement
      </h1>
      <p>
        Please click two points a known distance apart!
      </p>
      {selectedImage && <img src={selectedImage} alt="Selected Image" style={{ width: '1000px', height: 'auto' }}/>}
    </div>
    </>
     
  );
}

export default App;
