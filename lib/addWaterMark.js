const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const moment = require('moment');

let wStart,wEnd;

module.exports.init = function (videoPath, saveToPath) {
    new ffmpeg()
        .input(videoPath)
        .input('./assets/logo.png')
        .addOptions(['-preset:v ultrafast'])
        .complexFilter([{
            filter: 'overlay',
            options: 'x=W-w-10:y=h'
        }])
        .on('start', (command) => {
            wStart = moment(new Date());
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
        })
        .on('end', (proc, ffmpegData) => {
            // console.log('Process Completed', ffmpegData);
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

            // new ffmpeg()
            // .input('./videos' + saveToFolder + '/converted.mp4')
            // .on('error', (err) => {
            //     console.log('\x1b[31m', '\Error occured: ', err);
            // })
            // .videoFilters([
            //     {
            //       filter: 'fade',
            //       options: 'in:0:30'
            //     }
            //   ])
            //   .save('./videos' + saveToFolder + '/converted-1.mp4')        

        })
        .save(saveToPath + '/converted.mp4')
}

timeConvert = (startTime, endTime) => {
    const duration =  moment.duration(endTime.diff(startTime));
    const hours = Math.round(duration.asHours());
    const minutes = Math.round(duration.asMinutes());
    const seconds = Math.round(duration.asSeconds());
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}