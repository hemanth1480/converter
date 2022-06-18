
var myString   = "https://www.titanesmedellin.com/";
var myPassword = "myPassword";


var encrypted = CryptoJS.AES.encrypt(myString, myPassword);
var decrypted = CryptoJS.AES.decrypt(encrypted, myPassword);
document.getElementById("tt").innerHTML = encrypted;
console.log(encrypted);
console.log(decrypted);
