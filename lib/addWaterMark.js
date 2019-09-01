const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const moment = require('moment');

let wStart, wEnd;

module.exports.init = function (videoPath, saveToPath, initialTime) {
    new ffmpeg()
        .input(videoPath)
        .input('./assets/logo.png')
        .addOptions(['-preset:v veryfast'])
        .complexFilter([{
            filter: 'overlay',
            options: 'x=W-w:y=150'
        }])
        .on('start', (command) => {
            wStart = moment(new Date());
            initialTime = initialTime || wStart;
            console.log('\x1b[34m', '\nExecuting FFMPEG command.....', command);
            console.log('\x1b[34m', '\nAdding Watermark to the video......');
            console.log('\x1b[34m', '\n******************************************');
        })
        .on('progress', (progress) => {
            console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
            console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
        })
        .on('error', (err) => {
            console.log('\x1b[31m', '\Error occured: ', err);
        })
        .on('end', (proc, ffmpegData) => {
            try {
                console.log('\x1b[34m', '\nDeleting Temporary files......');
                fs.unlinkSync(videoPath);
                console.log('\x1b[32m', 'Successfully deleted temp files');
            } catch (err) {
                console.error('\x1b[31m', 'Unable to do the clean up.')
            }
            wEnd = moment(new Date());
            console.log('\x1b[34m', '\n********************COMPLETED**********************');
            console.log('\x1b[34m', '\nTotal time taken to add watermark: ', timeConvert(wStart, wEnd));
            console.log('\x1b[34m', '\n******************************************');
            console.log('\x1b[34m', '\nTotal time taken for entire process: ', timeConvert(initialTime, wEnd));
        })
        .save(saveToPath + '/converted.mp4')
}

timeConvert = (startTime, endTime) => {
    const duration = moment.duration(endTime.diff(startTime));
    const hours = Math.round(duration.asHours());
    const minutes = Math.round(duration.asMinutes());
    const seconds = Math.round(duration.asSeconds());
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}