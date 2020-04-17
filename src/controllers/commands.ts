import * as fs from 'fs';

import program = require('commander');
import { copyFolder, getDateFileName, zipDirectory } from '../utils/futils';
import { newCommand } from './newcommand';
import { CompositeLearningObject } from '../models/learningobjects';
import { Portfolio } from '../models/portfolio';
import { Course } from '../models/course';
import * as path from 'path';
const rmdir = require('rimraf');

const root = path.dirname(__dirname);

export interface CommandOptions {
  version: string;
  templates: boolean;
  new: boolean;
  private: boolean;
  rootPath: string;

  [propName: string]: any;
}

function createRoot(options: CommandOptions): CompositeLearningObject | null {
  if (fs.existsSync('portfolio.yaml')) {
    return new Portfolio(options);
  } else if (fs.existsSync('course.md')) {
    return new Course(options);
  }
  return null;
}

export class Commands {
  rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    program
      .arguments('<file>')
      .version(require('../../package.json').version)
      .parse(process.argv);
  }

  exec(): void {
    const options = program.opts() as CommandOptions;
    options.rootPath = this.rootPath;
    console.log('tutors-ar course web archive generator: ' + options.version);
    if (options.new) {
      newCommand();
    } else {
      const rootLearningObject = createRoot(options);
      if (rootLearningObject) {
        let site = 'public-site';
        copyFolder(`${root}/assets`, site);
        rootLearningObject.publish(site);
        zipDirectory(site, getDateFileName());
      } else {
        console.log('Cannot locate course.md or portfolio.yaml. Change to course folder and try again. ');
      }
    }
  }
}
