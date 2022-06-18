const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const multer = require("multer");
const path = require('path');
const {load} = require('nodemon/lib/config');
const {nextTick} = require('process');
const {dir} = require('console');
const {get} = require('express/lib/response');
const {on} = require('events');
const {spawn} = require("child_process");
var zipFolder = require('zip-folder');
const PDFMerger = require('pdf-merger-js');
const {ifError} = require('assert');

var merger = new PDFMerger();

const doc = new PDFDocument({
    compress: false
});
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static("public"));

var upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            var ddname = req.body.tt;
            if (!fs.existsSync("files/" + ddname)) {
                fs.mkdirSync("files/" + ddname);
            }
            cb(null, "files/" + ddname);
        },
        filename: function (req, file, callback) {
            callback(null, file.originalname)
        }
    })
});

app.get("/imgtopdf", (req, res) => {
    res.render("img-pdf");
});

app.get("/error", (req, res) => {
    res.render("error");
});

app.get("/doctopdf", (req, res) => {
    res.render("doctopdf");
});

app.get("/pdfmerger", (req, res) => {
    res.render("pdfmerger");
});

app.get("/imgtopdfcomplete", (req, res) => {
    if (req.query.id == undefined) {
        res.redirect("/imgtopdf");
    } else {
        fs.readdir(__dirname + "/files/" + req.query.id, (err) => {
            if (err) {
                res.render("imgtopdfco", {
                    id: req.query.id
                });
            } else {
                const python = spawn('python3', [__dirname + "/pythonscripts/remove-folder/index.py", req.query.id]);
                python.stdout.on('data', function (data) {
                    dataToSend = data.toString();
                });
                python.stderr.on('data', data => {
                    console.error(`stderr: ${data}`);
                });
                python.on('exit', (code) => {
                    console.log(`child process exited with code ${code}`);
                    res.render("imgtopdfco", {
                        id: req.query.id
                    });
                });
            }
        });
    }
});

app.get("/doctopdfcomplete", (req, res) => {
    if (req.query.id == undefined) {
        res.redirect("/doctopdf");
    } else {
        zipFolder("output-files/doctopdf/" + req.query.id, "output-files/doctopdf/" + req.query.id + "/" + req.query.id + ".zip", function (err) {
            if (err) {
                res.redirect("/doctopdf")
            } else {
                res.render("doctopdfco", {
                    id: req.query.id
                });
            }
        });
    }
});

app.get("/pdfselection", (req, res) => {
    fs.readdir("files/" + req.query.id, (err, files) => {
        if (err) {
            res.redirect("/pdfmerger");
        } else {
            if (files.length < 2) {
                res.redirect("/pdfmergeraddfiles?id=" + req.query.id);
            } else {
                res.render("pdfselection", {
                    fls: files,
                    id: req.query.id
                });
            }
        }
    });
});

app.get("/pdfmergeco", (req, res) => {
    if (req.query.id == undefined) {
        res.redirect("/pdfmerger");
    } else {
        fs.readdir("output-files/pdf-merger/" + req.query.id, (err) => {
            if (err) {
                res.redirect("/pdfmerger");
            } else {
                res.render("pdfmergeco", {
                    id: req.query.id
                });
            }
        });
    }
});

app.get("/pdfmergeraddfiles", (req, res) => {
    fs.readdir("files/" + req.query.id, (err) => {
        if (err) {
            res.redirect("/pdfmerger")
        } else {
            res.render("pdfmergeraddfiles", {
                id: req.query.id
            });
        }
    });
});

app.post("/download", (req, res) => {
    if (req.body.id == undefined) {
        res.redirect("/imgtopdf");
    } else {
        if (req.body.id.split("/")[1] == "imgtopdf") {
            fs.readFile(req.body.id + "/" + req.body.id.split("/").pop() + ".pdf", (err) => {
                if (err) {
                    res.redirect("/imgtopdf");
                } else {
                    res.download(__dirname + "/" + req.body.id + "/" + req.body.id.split("/").pop() + ".pdf");
                }
            });
        } else if (req.body.id.split("/")[1] == "doctopdf") {
            fs.readFile(req.body.id + "/" + req.body.id.split("/").pop() + ".zip", (err) => {
                if (err) {
                    res.redirect("/doctopdf");
                } else {
                    res.download(__dirname + "/" + req.body.id + "/" + req.body.id.split("/").pop() + ".zip");
                }
            });
        } else {
            fs.readFile(req.body.id + "/" + "merged.pdf", (err) => {
                if (err) {
                    res.redirect("/pdfmerger");
                } else {
                    res.download(__dirname + "/" + req.body.id + "/" + "merged.pdf");
                }
            });
        }
    }
});

app.post("/imgtopdf", upload.array('image'), (req, res) => {
    fs.mkdir("output-files/imgtopdf/" + req.body.tt, (err) => {
        if (err) {
            console.log(err);
        } else {
            writeStream = fs.createWriteStream("output-files/imgtopdf/" + req.body.tt + "/" + req.body.tt.split("/").pop() + ".pdf");
            doc.pipe(writeStream);
            var count = 0;
            let images = fs.readdirSync("files/" + req.body.tt, (err) => {
                if (err) {
                    console.log(err);
                }
            });
            images.forEach(file => {
                doc.image("files/" + req.body.tt + "/" + file, {
                    fit: [400, 320],
                    align: 'center',
                    valign: 'top'
                });
                doc.moveDown(1);
                count++;
                if (images.length % 2 == 0) {
                    if (count != images.length) {
                        if (count % 2 == 0) {
                            doc.addPage();
                        }
                    }
                } else {
                    if (count % 2 == 0) {
                        doc.addPage();
                    }
                }
            });
            doc.end();
            res.redirect("/imgtopdfcomplete?id=" + req.body.tt);
        }
    });
});

app.post("/doctopdf", upload.array('docx'), (req, res) => {
    fs.mkdir("output-files/doctopdf/" + req.body.tt, (err) => {
        if (err) {
            console.log(err);
        } else {
            const python = spawn('python3', [__dirname + "/pythonscripts/doctopdf/index.py", req.body.tt]);
            python.stdout.on('data', function (data) {
                dataToSend = data.toString();
            });
            python.stderr.on('data', data => {
                console.error(`stderr: ${data}`);
            });
            python.on('exit', (code) => {
                console.log(`child process exited with code ${code}`);
                res.redirect("/doctopdfcomplete?id=" + req.body.tt);
            });
        }
    });

});

app.post("/pdfmerger", upload.array('pdf'), (req, res) => {
    fs.mkdir("output-files/pdf-merger/" + req.body.tt, (err) => {
        if (err) {
            res.redirect("/pdfmerger");
        } else {
            res.redirect("/pdfselection?id=" + req.body.tt);
        }
    });
});

app.post("/pdfmergefile", (req, res) => {
    fs.readdir('files/' + req.body.tt, (err) => {
        if (err) {
            res.redirect("/pdfmerger")
        } else {
            req.body.dd.forEach(inp => {
                merger.add('files/' + req.body.tt + "/" + inp);
            });
            merger.save("output-files/pdf-merger/" + req.body.tt + "/merged.pdf")
                .then((err) => {
                    if (err) {
                        res.redirect("/pdfmerger");
                    } else {
                        const python = spawn('python3', [__dirname + "/pythonscripts/remove-folder/index.py", req.body.tt]);
                        python.stdout.on('data', function (data) {
                            dataToSend = data.toString();
                        });
                        python.stderr.on('data', data => {
                            console.error(`stderr: ${data}`);
                        });
                        python.on('exit', (code) => {
                            console.log(`child process exited with code ${code}`);
                            res.redirect("/pdfmergeco?id=" + req.body.tt);
                        });
                    }
                });
        }
    });
});

app.post("/pdfmergeraddfiles", upload.array("pdf"), (req, res) => {
    res.redirect("/pdfselection?id=" + req.body.tt);
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 47;
}

app.listen(port, () => {
  console.log("Server started on port 47")
}); 
