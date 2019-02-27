const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

const ext = '.mp4';
let listOfVideos = [];


const constructlist = async (pathToVideos, skipOutput) => {
    return new Promise((resolve, reject) => {
        fs.readdir(pathToVideos, (err, files) => {
            if (err) console.error('\x1b[31m', 'Error Occured: ', err);
            files.filter((file) => {
                if (path.extname(file).toLowerCase() === ext) {
                    listOfVideos.push({
                        filePath: pathToVideos + '/' + file,
                        fileName: path.basename(pathToVideos + '/' + file, path.extname(file))
                    });
                }
            })
            if (listOfVideos.length <= 0) {
                console.error('\x1b[31m', 'No files with .mp4 extension found inside WATERMARK folder\n'.toUpperCase());
            } else {
                if (!(pathToVideos.includes('output'))) {
                    if (!fs.existsSync(pathToVideos + '/output')) {
                        fs.mkdirSync(pathToVideos + '/output');
                    }
                }
            }
            return resolve(listOfVideos);
        });
    });
}

const executeCommand = async (fileObj, skipOutput) => {
    let startTime;
    let endTime;
    return new Promise((resolve, reject) => {
        new ffmpeg(fileObj.filePath)
            .input('./assets/logo.png')
            .addOptions(['-preset:v ultrafast'])
            .complexFilter([{
                filter: 'overlay',
                options: 'x=W-w:y=25'
            }])
            .on('start', (command) => {
                startTime = moment(new Date());
                console.log('\x1b[34m', '\nAdding Watermark to the video......');
                console.log('\x1b[34m', '\nExecuting FFMPEG command.....', command);
                console.log('\x1b[34m', '\n******************************************');
            })
            .on('progress', (progress) => {
                console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
                console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
            })
            .on('error', (err) => {
                console.log('\x1b[31m', '\Error occured: ', err);
                return reject({
                    'err': false,
                    'stack': err
                });
            })
            .on('end', (proc, ffmpegData) => {
                endTime = moment(new Date());
                console.log('\x1b[34m', '\nTotal time taken to add watermark: ', timeConvert(startTime, endTime));
                console.log('\x1b[34m', '\n********************COMPLETED**********************');
                try {
                    console.log('\x1b[34m', '\nDeleting MP4 files......');
                    fs.unlink(fileObj.filePath);
                    console.log('\x1b[32m', 'Successfully deleted temp files');
                } catch (err) {
                    console.error('\x1b[31m', 'Unable to do the clean up.', err)
                }
                console.log('\x1b[34m', '\n******************************************');
                return resolve({
                    'err': true,
                    'stack': 'File conversion completed'
                });
            })
            .save(skipOutput ?
                (fileObj.filePath.slice(0, fileObj.filePath.indexOf(fileObj.fileName)) + 'w' + fileObj.filePath.slice(fileObj.filePath.indexOf(fileObj.fileName))) :
                './videos/WATERMARK/output/' + fileObj.fileName + '.mp4')
    })
}

const triggerCommandForEachFile = async (pathToVideos, skipOutput) => {
    let processingStatus;
    const videoList = await constructlist(pathToVideos, skipOutput);
    let tempList = [...videoList];
    while (tempList.length > 0) {
        let tempFileObj = tempList.shift();
        processingStatus = await executeCommand(tempFileObj, skipOutput);
    }
    return new Promise((resolve, reject) => {
        return resolve(processingStatus);
    })
}

module.exports.init = async (pathToVideos = './videos/WATERMARK', skipOutput = false) => {
    const processingComplete = await triggerCommandForEachFile(pathToVideos, skipOutput);
    if (processingComplete.err) {
        console.log('completed');
    } else {
        console.log(processingComplete.stack)
    }
}

timeConvert = (startTime, endTime) => {
    const duration = moment.duration(endTime.diff(startTime));
    const hours = Math.round(duration.asHours());
    const minutes = Math.round(duration.asMinutes());
    const seconds = Math.round(duration.asSeconds());
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}