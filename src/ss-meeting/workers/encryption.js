onmessage = async (event) => {
  const operation = event.data[0];
  if (operation === 'enable') {
    console.log("encryption.js : encryption enabled");
  } else if (operation === 'disable') {
    console.log("encryption.js : encryption disabled");
  }
}
