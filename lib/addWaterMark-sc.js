const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const ext = '.mp4';
const pathToVideos = './videos/WATERMARK';
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
                console.error('\x1b[31m', 'No files with .mp4 extension found inside WATERMARK folder');
                process.exit(0);
            } else {
                if (!fs.existsSync(pathToVideos + '/output')) {
                    fs.mkdirSync(pathToVideos + '/output');
                }
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
    let startTime;
    let endTime;
    const appFfmpeg = await setupFfmpegInputs();
    appFfmpeg
        .input('./watermark/logo.png')
        .addOptions(['-preset:v ultrafast'])
        .complexFilter([{
            filter: 'overlay',
            options: 'x=W-w-10:y=h'
        }])
        .on('start', (command) => {
            startTime = new Date();
            console.log('\x1b[34m', '\nAdding Watermark to the video......');
            console.log('\x1b[34m', '\nExecuting FFMPEG command.....', command);
            console.log('\x1b[34m', '\n******************************************');
        })
        .on('end', (proc, ffmpegData) => {
            endTime = new Date();
            console.log('\x1b[34m', '\nTotal time taken: ', timeConvert(startTime, endTime));
            console.log('\x1b[34m', '\n********************COMPLETED**********************');
            try {
                console.log('\x1b[34m', '\nDeleting AVI files......');
                listOfVideos.forEach(function (videoName) {
                    fs.unlinkSync(videoName);
                });
                console.log('\x1b[32m', 'Successfully deleted temp files');
            } catch (err) {
                console.error('\x1b[31m', 'Unable to do the clean up.')
            }
            console.log('\x1b[34m', '\n******************************************');
        })
        .on('progress', (progress) => {
            console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
            console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
        })
        .on('error', (err) => {
            console.log('\x1b[31m', '\Error occured: ', err);
        })
        .save(pathToVideos + '/output/converted.mp4')
}

timeConvert = (start, end) => {
    const hours = end.getHours() - start.getHours();
    const minutes = end.getMinutes() - start.getMinutes();
    const seconds = end.getSeconds() - start.getSeconds();
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}

init();