const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs-extra");
const moment = require("moment");

const mergeMp4 = require("./lib/mergeMp4Files");

const ext = ".avi";
const pathToVideos = "./videos/AVI";
let listOfVideos = [];
let processStartTime;

const constructlist = async () => {
  return new Promise((resolve, reject) => {
    fs.readdir(pathToVideos, (err, files) => {
      if (err) console.error("\x1b[31m", "Error Occured: ", err);
      files.filter(file => {
        if (path.extname(file).toLowerCase() === ext) {
          listOfVideos.push({
            filePath: pathToVideos + "/" + file,
            fileName: path.basename(
              pathToVideos + "/" + file,
              path.extname(file)
            )
          });
        }
      });
      if (listOfVideos.length <= 0) {
        console.error(
          "\x1b[31m",
          "No files with .avi extension found inside AVI folder"
        );
        process.exit(0);
      } else {
        if (!fs.existsSync(pathToVideos + "/output")) {
          fs.mkdir(pathToVideos + "/output", err => {
            if (!fs.existsSync(pathToVideos + "/output/temp")) {
              fs.mkdir(pathToVideos + "/output/temp");
            }
          });
        } else {
          if (!fs.existsSync(pathToVideos + "/output/temp")) {
            fs.mkdir(pathToVideos + "/output/temp");
          }
        }
      }
      return resolve(listOfVideos);
    });
  });
};

const executeCommand = async fileObj => {
  let aviStart;
  let aviEnd;
  const duration = await getDuration(fileObj);
  return new Promise((resolve, reject) => {
    new ffmpeg(fileObj.filePath)
      .inputOptions(["-analyzeduration 15m", "-probesize 1000000"])
      .outputOptions(["-preset veryfast", "-max_muxing_queue_size 9999"])
      // .videoFilters([
      //   {
      //     filter: "fade",
      //     options: `t=out:st=${duration - 1}:d=0.5`
      //   }
      // ])

      .on("start", command => {
        aviStart = moment(new Date());
        processStartTime = processStartTime || aviStart;
        console.log("\x1b[34m", "Executing FFMPEG command.....", command);
      })
      .on("progress", progress => {
        console.log(
          "\x1b[32m",
          "\nProcessing: " + progress.targetSize + " KB converted"
        );
        console.log(
          "\x1b[32m",
          "\nPercentage complete: " + Math.round(progress.percent) + " %"
        );
        console.log("\x1b[32m", "Processing timemark: " + progress.timemark);
      })
      .on("error", (err, stdout, stderr) => {
        console.error("\x1b[31m", "Error occured: ", err);
        console.error("\x1b[31m", "stdout", stdout);
        console.error("\x1b[31m", "stderr", stderr);
        return reject({
          err: false,
          stack: err
        });
      })
      .on("end", (proc, ffmpegData) => {
        aviEnd = moment(new Date());
        console.log(
          "\x1b[34m",
          "\nTotal time taken to convert to MP4: ",
          timeConvert(aviStart, aviEnd)
        );
        console.log(
          "\x1b[34m",
          "\n********************COMPLETED**********************"
        );
        try {
          console.log("\x1b[34m", "\nDeleting the AVI file......");
          fs.unlink(fileObj.filePath);
          console.log("\x1b[32m", "Successfully deleted temp files");
        } catch (err) {
          console.error("\x1b[31m", "Unable to do the clean up.");
        }
        return resolve({
          err: true,
          stack: "File conversion completed"
        });
      })
      .save(pathToVideos + "/output/temp/" + fileObj.fileName + ".mp4");
  });
};

const getDuration = async fileObj => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(fileObj.filePath, (err, metaData) => {
      if (err) {
        reject(err);
      }
      resolve({
        duration: Math.round(metaData.format.duration).toFixed(2)
      });
    });
  });
};

const triggerCommandForEachFile = async () => {
  let processingStatus;
  const videoList = await constructlist();
  let tempList = [...videoList];
  while (tempList.length > 0) {
    let tempFileObj = tempList.shift();
    processingStatus = await executeCommand(tempFileObj);
  }
  return new Promise((resolve, reject) => {
    return resolve(processingStatus);
  });
};

const init = async () => {
  const processingComplete = await triggerCommandForEachFile();
  if (processingComplete.err) {
    mergeMp4.init("./videos/AVI/output/temp", true, processStartTime);
  } else {
    console.log(processingComplete.stack);
  }
};

timeConvert = (startTime, endTime) => {
  const duration = moment.duration(endTime.diff(startTime));
  const hours = Math.round(duration.asHours());
  const minutes = Math.round(duration.asMinutes());
  const seconds = Math.round(duration.asSeconds());
  return (
    (hours ? hours + " hours" : "") +
    " " +
    (minutes ? minutes + " minute/s" : "") +
    " " +
    (seconds ? seconds + " second/s" : "")
  );
};

init();
