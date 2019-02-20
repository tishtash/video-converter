const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const watermarkAddition = require('./addWaterMark');

const ext = '.avi';
const pathToVideos = './videos/AVI';
let listOfVideos = [];
let mergeVideos = ffmpeg();


const constructlist = async () => {
    return new Promise((resolve, reject) => {
        fs.readdir(pathToVideos, (err, files) => {
            if (err) console.error('\x1b[31m', 'Error Occured: ', err);
            files.filter((file) => {
                if (path.extname(file).toLowerCase() === ext) {
                    listOfVideos.push(pathToVideos + '/' + file);
                }
            })
            if (listOfVideos.length <= 0) {
                console.error('\x1b[31m', 'No files with .avi extension found inside AVI folder');
                process.exit(0);
            }
            return resolve(listOfVideos);
        });
    });
}

const setupFfmpegInputs = async () => {
    const videoList = await constructlist();
    return new Promise((resolve, reject) => {
        videoList.forEach(function (videoName) {
            mergeVideos = mergeVideos.addInput(videoName);
        });
        return resolve(mergeVideos);
    })
}

const init = async () => {
    let start;
    let end;
    const appFfmpeg = await setupFfmpegInputs();
    appFfmpeg.addOptions(['-c:v h264', '-preset:v ultrafast'])
        .on('start', (command) => {
            start = new Date();
            console.log('\x1b[34m', 'Executing FFMPEG command.....', command);
        })
        .on('end', (proc, ffmpegData) => {
            // console.log('Process Completed', ffmpegData);
            end = new Date();
            console.log('\x1b[34m', '\nTotal time taken to merge: ', timeConvert(start, end));
            console.log('\x1b[34m', '\n********************COMPLETED**********************');
            try {
                console.log('\x1b[34m', '\nDeleting AVI files......');
                listOfVideos.forEach(function (videoName) {
                    console.log(videoName);
                    fs.unlinkSync(videoName);
                });
                console.log('\x1b[32m', 'Successfully deleted temp files');
            } catch (err) {
                console.error('\x1b[31m', 'Unable to do the clean up.')
            }
            watermarkAddition.init(pathToVideos + '/temp.mp4', '/avi');
        })
        .on('progress', (progress) => {
            console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
            console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
            console.log('\x1b[32m', 'Processing timemark: ' + progress.timemark);
        })
        .on('error', (err) => {
            console.error('\x1b[31m', '\Error occured: ', err);
        })
        .mergeToFile(pathToVideos + '/temp.mp4')
}


timeConvert = (start, end) => {
    const hours = end.getHours() - start.getHours();
    const minutes = end.getMinutes() - start.getMinutes();
    const seconds = end.getSeconds() - start.getSeconds();
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}

init();