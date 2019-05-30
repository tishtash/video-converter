const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

const watermarkAddition = require('./addWaterMark');

const ext = '.mp4';
let listOfVideos = [];
let mergeVideos = ffmpeg();
let mpStartTime, mpEndTime, initialTime;

const constructlist = async (pathToVideos, skipOutputFolder) => {
    return new Promise((resolve, reject) => {
        fs.readdir(pathToVideos, (err, files) => {
            if (err) console.error('\x1b[31m', 'Error Occured: ', err);
            var filesStream = fs.createWriteStream(pathToVideos + '/file.txt')
            files.filter((file) => {
                if (path.extname(file).toLowerCase() === ext) {
                    listOfVideos.push(pathToVideos + '/' + file);
                    console.log('Writing ' + file + ' file to file.txt....');
                    filesStream.write('file ' + file.replace(/(["\s'$`\\])/g, '\\$1') + '\n');
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
    const tempList = [...videoList];
    while (tempList.length > 0) {
        videoItem = tempList.shift();
        mergeVideos = mergeVideos.addInput(videoItem);
        try {
            await convertVideoScale(videoItem);
        } catch (err) {
            console.log(err);
            process.exit(0);
        }
    }
    return new Promise(async (resolve, reject) => {
        resolve(mergeVideos);
    })
}

const getDuration = async (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metaData) => {
            resolve(Math.round(metaData.format.duration).toFixed(2));
        })
    })
}

const convertVideoScale = async (videoFile) => {
    const duration = await getDuration(videoFile);
    return new Promise((resolve, reject) => {
        ffmpeg(videoFile)
            .addOptions(['-preset:v ultrafast'])
            .videoFilters([{
                    filter: 'fade',
                    options: `t=out:st=${duration - 1}:d=0.5`
                },
                {
                    filter: 'scale',
                    options: '2896:1628'
                }
            ])
            .on('start', (command) => {
                mpStartTime = moment(new Date());
                initialTime = initialTime || moment(new Date());
                console.log('\ncommand: ', command);
                console.log('\x1b[34m', '\nStarting video scaling process.....');
            })
            .on('progress', (progress) => {
                console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
                console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
            })
            .on('error', (err) => {
                console.error('\x1b[31m', '\Error occured: ', err);
                reject('Errored');
            })
            .on('end', (proc, ffmpegData) => {
                mpEndTime = moment(new Date());
                console.log('\x1b[34m', `\nTotal time taken to scale video file: ${videoFile.substring(videoFile.lastIndexOf('/') + 1, videoFile.lastIndexOf('.'))}.mp4: `, mpTimeConvert(mpStartTime, mpEndTime));
                mpStartTime, mpEndTime = null;
                fs.unlink(videoFile, (err) => {
                    if (err) console.log(err);
                });
                fs.rename(videoFile.replace(videoFile.substring(videoFile.lastIndexOf('/') + 1, videoFile.lastIndexOf('.')), videoFile.substring(videoFile.lastIndexOf('/') + 1, videoFile.lastIndexOf('.')) + '$copy'),
                    videoFile,
                    function (err) {
                        if (err) console.log('ERROR: ' + err);
                    });
                resolve('done');
            })
            .save(videoFile.replace(videoFile.substring(videoFile.lastIndexOf('/') + 1, videoFile.lastIndexOf('.')), videoFile.substring(videoFile.lastIndexOf('/') + 1, videoFile.lastIndexOf('.')) + '$copy'));
    })
}

module.exports.init = async (pathToVideos, skipOutputFolder, startTime) => {
    initialTime = startTime;
    const appFfmpeg = await setupFfmpegInputs(pathToVideos, skipOutputFolder, startTime);
    appFfmpeg
        .addOptions(['-preset:v ultrafast'])
        .mergeToFile((skipOutputFolder ? './videos/AVI/output/temp.mp4' : pathToVideos + '/output/temp.mp4'))
        .on('start', (command) => {
            mpStartTime = moment(new Date());
            console.log('command: ', command);
            console.log('\x1b[34m', '\nStarting video merging process.....');
        })
        .on('progress', (progress) => {
            console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
            console.log('\x1b[32m', 'Processing timemark: ' + progress.timemark);
        })
        .on('error', (err) => {
            console.error('\x1b[31m', '\Error occured: ', err);
        })
        .on('end', (proc, ffmpegData) => {
            mpEndTime = moment(new Date());
            console.log('\x1b[34m', '\nTotal time taken to merge: ', mpTimeConvert(mpStartTime, mpEndTime));
            console.log('\x1b[34m', '\nTotal time taken for entire merge process: ', mpTimeConvert(initialTime, mpEndTime));
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
            watermarkAddition.init(
                (skipOutputFolder ? './videos/AVI/output/temp.mp4' : pathToVideos + '/output/temp.mp4'), (skipOutputFolder ? './videos/AVI/output' : pathToVideos + '/output'), initialTime
            );
        })
}


mpTimeConvert = (startTime, endTime) => {
    const duration = moment.duration(endTime.diff(startTime));
    const hours = Math.round(duration.asHours());
    const minutes = Math.round(duration.asMinutes());
    const seconds = Math.round(duration.asSeconds());
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}