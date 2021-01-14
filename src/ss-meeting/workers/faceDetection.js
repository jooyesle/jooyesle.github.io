  
onmessage = async (event) => {
  const {operation} = event.data;
  if (operation === 'enable') {
    console.log("encryption.js : face detection enabled");
  } else if (operation === 'disable') {
    console.log("encryption.js : face detection disabled");
  }
}
