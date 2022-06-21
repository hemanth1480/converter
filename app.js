const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const multer = require("multer");
let {
    PythonShell
} = require('python-shell');
const {
    PDFNet
} = require('@pdftron/pdfnet-node');
var zipFolder = require('zip-folder');

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
                let options = {
                    mode: 'text',
                    pythonOptions: ['-u'],
                    scriptPath: 'pythonscripts/remove-folder',
                    args: [req.query.id]
                };
                PythonShell.run('/index.py', options, function (err, results) {
                    if (err) throw err;
                    else {
                        console.log('results: %j', results);
                        res.render("imgtopdfco", {
                            id: req.query.id
                        });
                    }
                });
            }
        });
    }
});

app.get("/doctopdfcomplete", (req, res) => {
    if (req.query.id == undefined) {
        res.redirect("/doctopdf");
    } else {
        let options = {
            mode: 'text',
            pythonOptions: ['-u'],
            scriptPath: 'pythonscripts/remove-folder',
            args: [req.query.id]
        };
        PythonShell.run('/index.py', options, function (err, results) {
            if (err) {
                res.redirect("/doctopdf")
            } else {
                console.log('results: %j', results);
                fs.readdir("output-files/doctopdf/" + req.query.id, (err) => {
                    if (err) {
                        res.redirect("/doctopdf")
                    } else {
                        zipFolder("output-files/doctopdf/" + req.query.id, "output-files/doctopdf/" + req.query.id + "/" + req.query.id + ".zip", (error) => {
                            if (error) {
                                res.redirect("/doctopdf")
                            } else {
                                res.render("doctopdfco", {
                                    id: req.query.id
                                });
                            }
                        });
                    }
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
        } else if (req.body.id.split("/")[1] == "pdf-merger") {
            fs.readFile(req.body.id + "/" + "merge.pdf", (err) => {
                if (err) {
                    res.redirect("/pdfmerger");
                } else {
                    res.download(__dirname + "/" + req.body.id + "/" + "merge.pdf");
                }
            });
        } else {
            var fid = req.body.id.split("/").pop();
            fs.readFile(req.body.id + "/" + fid + ".zip", (err) => {
                if (err) {
                    res.redirect("/doctopdf");
                } else {
                    res.download(__dirname + "/" + req.body.id + "/" + fid + ".zip");
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
            fs.readdir("files/" + req.body.tt, (err, fls) => {
                if (err) {
                    console.log(err);
                } else {
                    let count = 0
                    fls.forEach(one => {
                        const main = async () => {
                            const pdfdoc = await PDFNet.PDFDoc.create();
                            await pdfdoc.initSecurityHandler();
                            await PDFNet.Convert.toPdf(pdfdoc, "files/" + req.body.tt + "/" + one);
                            pdfdoc.save(
                                "output-files/doctopdf/" + req.body.tt + "/" + one.split(".")[0] + ".pdf",
                                PDFNet.SDFDoc.SaveOptions.e_linearized,
                            );
                        };

                        PDFNet.runWithCleanup(main, 'demo:1655819399669:7a7ea63a0300000000f8674b8875d719b92b2a1b6dddb6eb4d27bcfd85').catch(function (error) {
                            console.log('Error: ' + JSON.stringify(error));
                        }).then(function () {
                            if (count == fls.length - 1) {
                                res.redirect("/doctopdfcomplete?id=" + req.body.tt)
                            } else {
                                count++
                            }
                        });
                    });
                }
            })
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
            let options = {
                mode: 'text',
                pythonOptions: ['-u'],
                scriptPath: 'pythonscripts/pdfmerger',
                args: [req.body.dd, req.body.tt]
            };
            PythonShell.run('/index.py', options, function (err, results) {
                if (err) throw err;
                else {
                    console.log('results:', results);
                    res.redirect("/pdfmergeco?id=" + req.body.tt);
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
    console.log("Server started on port " + port)
});