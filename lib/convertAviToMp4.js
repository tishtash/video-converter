const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const watermarkAddition = require('./addWaterMark-sc');

const ext = '.avi';
const pathToVideos = './videos/AVI';
let listOfVideos = [];


const constructlist = async () => {
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
                console.error('\x1b[31m', 'No files with .avi extension found inside AVI folder');
                process.exit(0);
            } else {
                if (!fs.existsSync(pathToVideos + '/output')) {
                    fs.mkdir(pathToVideos + '/output', (err) => {
                        // if (!fs.existsSync(pathToVideos + '/output/temp')) {
                        //     fs.mkdir(pathToVideos + '/output/temp');
                        // }
                    });
                    // } else {
                    //     if (!fs.existsSync(pathToVideos + '/output/temp')) {
                    //         fs.mkdir(pathToVideos + '/output/temp');
                    //     }
                }
            }
            // ffmpeg.ffprobe(listOfVideos[0], (err, metaData) => {
            //     // console.log('metaData', metaData);
            // })
            return resolve(listOfVideos);
        });
    });
}

const executeCommand = async (fileObj) => {
    let aviStart;
    let aviEnd;
    const duration = await getDuration(fileObj);
    return new Promise((resolve, reject) => {
        new ffmpeg(fileObj.filePath)
            .addOptions(['-preset:v veryfast'])
            .videoFilters([{
                filter: 'fade',
                options: `t=out:st=${duration - 1}:d=0.5`
            }])
            .on('start', (command) => {
                aviStart = moment(new Date());
                console.log('\x1b[34m', 'Executing FFMPEG command.....', command);
            })
            .on('progress', (progress) => {
                console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
                console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
                console.log('\x1b[32m', 'Processing timemark: ' + progress.timemark);
            })
            .on('error', (err) => {
                console.error('\x1b[31m', '\Error occured: ', err);
                return reject({
                    'err': false,
                    'stack': err
                });
            })
            .on('end', (proc, ffmpegData) => {
                // console.log('Process Completed', ffmpegData);
                aviEnd = moment(new Date());
                console.log('\x1b[34m', '\nTotal time taken to convert to MP4: ', timeConvert(aviStart, aviEnd));
                console.log('\x1b[34m', '\n********************COMPLETED**********************');
                try {
                    console.log('\x1b[34m', '\nDeleting the AVI file......');
                    console.log('Unlinking path', fileObj.filePath);
                    fs.unlink(fileObj.filePath);
                    console.log('\x1b[32m', 'Successfully deleted temp files');
                } catch (err) {
                    console.error('\x1b[31m', 'Unable to do the clean up.', err)
                }
                return resolve({
                    'err': true,
                    'stack': 'File conversion completed'
                });
            })
            .save(pathToVideos + '/output/' + fileObj.fileName + '.mp4')
    })
}

const getDuration = async (fileObj) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(fileObj.filePath, (err, metaData) => {
            resolve(Math.round(metaData.format.duration).toFixed(2));
        })
    })
}

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
    })
}

const init = async () => {
    const processingComplete = await triggerCommandForEachFile();
    if (processingComplete.err) {
        console.log('completed');
        // watermarkAddition.init('./videos/AVI/output', true);
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

init();