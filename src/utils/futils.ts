import * as fs from 'fs';
import * as path from 'path';
import * as sh from 'shelljs';
const archiver = require('archiver');
import { Properties } from '../models/properties';
import * as yaml from 'yamljs';
import slugify from 'slugify';
import { reapLos } from '../models/loutils';

const _ = require('lodash');

sh.config.silent = true;

export function writeFile(folder: string, filename: string, contents: string): void {
  if (!fs.existsSync(folder)) {
    sh.mkdir(folder);
  }
  return fs.writeFileSync(folder + '/' + filename, contents);
}

export function readFile(path: string): string {
  if (fs.existsSync(path)) {
    const array = fs.readFileSync(path).toString().split('\n');
    return array[0].replace('\r', '');
  } else {
    console.log('unable to locate ' + path);
  }
  return '';
}

export function readFullFile(path: string): string[] {
  if (fs.existsSync(path)) {
    const array = fs.readFileSync(path).toString().split('\n');
    return array;
  } else {
    console.log('unable to locate ' + path);
  }
  return [];
}

export function readWholeFile(path: string): string {
  if (fs.existsSync(path)) {
    const array = fs.readFileSync(path).toString();
    return array;
  } else {
    console.log('unable to locate ' + path);
  }
  return '';
}

export function readFileFromTree(path: string): string {
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path)) {
      return readFile(path);
    } else {
      path = '../' + path;
    }
  }
  return '';
}

export function getImageFile(name: string): string {
  const validImageTypes = ['png', 'jpg', 'jpeg', 'gif'];
  for (let type of validImageTypes) {
    const image = name + '.' + type;
    if (fs.existsSync(image)) {
      return image;
    }
  }
  return '';
}

export function getParentFolder(): string {
  return path.basename(path.dirname(process.cwd()));
}

export function getDirectories(srcpath: string): string[] {
  return fs.readdirSync(srcpath).filter(function (file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

export function verifyFolder(folder: string): void {
  if (!fs.existsSync(folder)) {
    sh.mkdir('-p', folder);
  }
}

export function copyFileToFolder(src: string, dest: string): void {
  if (fs.existsSync(src)) {
    sh.mkdir('-p', dest);
    sh.cp('-rf', src, dest);
  }
}

export function getCurrentDirectory(): string {
  return sh.pwd();
}

export function initEmptyPath(path: string): void {
  if (fs.existsSync(path)) {
    sh.rm('-rf', path);
  }
  sh.mkdir('-p', path);
}

export function initPath(path: string): void {
  sh.mkdir('-p', path);
}

export function copyFolder(src: string, dest: string): void {
  sh.mkdir('-p', dest);
  sh.cp('-rf', src, dest);
}

export function getIgnoreList(): string[] {
  const ignoreList: string[] = [];
  if (fs.existsSync('mbignore')) {
    const array = fs.readFileSync('mbignore').toString().split('\n');
    for (let i = 0; i < array.length; i++) {
      ignoreList[i] = array[i].trim();
    }
  }
  return ignoreList;
}

export function getYamlIgnoreList(): string[] {
  const yamlData = yaml.load('./properties.yaml');
  return yamlData.ignore;
}

function readYaml(path: string): Properties {
  const properties = new Properties();
  const yamlData = yaml.load(path);
  _.defaults(yamlData, properties);
  return yamlData;
}

export function readPropsFromTree(): Properties {
  let properties = new Properties();
  let path = 'properties.yaml';
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path)) {
      const yamlData = readYaml(path);
      _.defaults(properties, yamlData);
      path = '../' + path;
    } else {
      path = '../' + path;
    }
  }

  if (!properties.courseurl) {
    properties.courseurl = readFileFromTree('courseurl');
  }
  if (properties.courseurl && properties.courseurl[properties.courseurl.length - 1] != '/') {
    properties.courseurl += '/';
  }
  return properties;
}

export function resizeImage(path: string) {}

export function zipDirectory(courseTitle: string | undefined, source: string) {
  let title = '';
  if (courseTitle) {
    title = slugify(courseTitle, { lower: true });
  }
  const out = title + getDateFileName();
  console.log(`Generating archive ... ${out} (just a munite)`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    // @ts-ignore
    archive
      .directory(source, false)
      .on('error', (err: any) => reject(err))
      .pipe(stream);

    stream.on('close', () => {
      resolve();
      console.log('Done')
    });
    archive.finalize();
  });
}

export function getDateFileName() {
  let ts = Date.now();

  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  let hrs = date_ob.getHours();
  let mins = date_ob.getMinutes();
  let secs = date_ob.getSeconds();

  return `-${year}-${month}-${date}-${hrs}-${mins}.zip`;
}
