const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

const watermarkAddition = require('./addWaterMark');

const ext = '.mp4';
let listOfVideos = [];
let mergeVideos = ffmpeg();
let mpStartTime, mpEndTime;

const constructlist = async (pathToVideos, skipOutputFolder) => {
    return new Promise((resolve, reject) => {
        fs.readdir(pathToVideos, (err, files) => {
            if (err) console.error('\x1b[31m', 'Error Occured: ', err);
            var filesStream = fs.createWriteStream(pathToVideos + '/file.txt')
            files.filter((file) => {
                if (path.extname(file).toLowerCase() === ext) {
                    listOfVideos.push(pathToVideos + '/' + file);
                    console.log('Writing ' + file + ' file to file.txt....');
                    filesStream.write('file ' + file + '\n');
                }
            })
            filesStream.end(() => console.log('List of file names appended to file.txt!!'));
            if (listOfVideos.length <= 0) {
                console.error('\x1b[31m', 'No files with .mp4 extension found inside MP4 folder');
                process.exit(0);
            } else {
                if (!skipOutputFolder) {
                    if (!fs.existsSync(pathToVideos + '/output')) {
                        fs.mkdirSync(pathToVideos + '/output');
                    }
                }
            }
            return resolve(listOfVideos);
        });
    });
}

const setupFfmpegInputs = async (pathToVideos, skipOutputFolder) => {
    const videoList = await constructlist(pathToVideos, skipOutputFolder);
    return new Promise((resolve, reject) => {
        // videoList.forEach(function (videoName) {
        // mergeVideos = mergeVideos.addInput(videoName);
        // });
        mergeVideos
            .addInput(pathToVideos + '/file.txt')
            .addInputOptions(['-f concat']);
        return resolve(mergeVideos);
    })
}

module.exports.init = async (pathToVideos, skipOutputFolder) => {
    const appFfmpeg = await setupFfmpegInputs(pathToVideos, skipOutputFolder);
    appFfmpeg.addOptions(['-c copy', '-c:v h264', '-preset:v ultrafast'])
        .on('start', (command) => {
            mpStartTime = moment(new Date());
            console.log('\x1b[34m', 'Executing FFMPEG command.....', command);
        })
        .on('progress', (progress) => {
            console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
            console.log('\x1b[32m', 'Processing timemark: ' + progress.timemark);
        })
        .on('error', (err) => {
            console.error('\x1b[31m', '\Error occured: ', err);
        })
        .on('end', (proc, ffmpegData) => {
            // console.log('Process Completed', ffmpegData);
            mpEndTime = moment(new Date());
            console.log('\x1b[34m', '\nTotal time taken to merge: ', mpTimeConvert(mpStartTime, mpEndTime));
            console.log('\x1b[34m', '\n********************COMPLETED**********************');
            try {
                console.log('\x1b[34m', '\nDeleting MP4 files......');
                listOfVideos.forEach(function (videoName) {
                    fs.unlink(videoName);
                });
                console.log('\x1b[34m', '\nDeleting file.txt file......');
                fs.unlink(pathToVideos + '/file.txt');
                if (skipOutputFolder) {
                    fs.remove(pathToVideos);
                }
                console.log('\x1b[32m', 'Successfully deleted temp files');
            } catch (err) {
                console.error('\x1b[31m', 'Unable to do the clean up.')
            }
            // (skipOutputFolder ? '/temp.mp4' : '/output/temp.mp4')
            watermarkAddition.init(
                (skipOutputFolder ? './videos/AVI/output/temp.mp4' : pathToVideos + '/output/temp.mp4'), (skipOutputFolder ? './videos/AVI/output' : pathToVideos + '/output')
            );
        })
        // .save('./videos/AVI/output/converted.mp4');
        .save((skipOutputFolder ? './videos/AVI/output/temp.mp4' : pathToVideos + '/output/temp.mp4'));
}


mpTimeConvert = (startTime, endTime) => {
    const duration =  moment.duration(endTime.diff(startTime));
    const hours = Math.round(duration.asHours());
    const minutes = Math.round(duration.asMinutes());
    const seconds = Math.round(duration.asSeconds());
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}