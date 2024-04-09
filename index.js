#!/usr/bin/env node

import * as childProcess from "node:child_process";
import * as OS from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";

import { red, lightGreen, bold, white, green, lightYellow } from "kolorist";
import prompts from "prompts";

// The banner text is 'SGB - A tool easier switching git branches'
const gradientBanner =
  '\x1B[38;2;66;211;146mS\x1B[39m\x1B[38;2;66;211;146mG\x1B[39m\x1B[38;2;66;211;146mB\x1B[39m\x1B[38;2;66;211;146m \x1B[39m\x1B[38;2;66;211;146m-\x1B[39m\x1B[38;2;67;209;149m \x1B[39m\x1B[38;2;68;206;152mA\x1B[39m \x1B[38;2;69;204;155mt\x1B[39m\x1B[38;2;70;201;158mo\x1B[39m\x1B[38;2;71;199;162mo\x1B[39m\x1B[38;2;72;196;165ml\x1B[39m \x1B[38;2;73;194;168me\x1B[39m\x1B[38;2;74;192;171ma\x1B[39m\x1B[38;2;75;189;174ms\x1B[39m\x1B[38;2;76;187;177mi\x1B[39m\x1B[38;2;77;184;180me\x1B[39m\x1B[38;2;78;182;183mr\x1B[39m \x1B[38;2;79;179;186ms\x1B[39m\x1B[38;2;80;177;190mw\x1B[39m\x1B[38;2;81;175;193mi\x1B[39m\x1B[38;2;82;172;196mt\x1B[39m\x1B[38;2;83;170;199mc\x1B[39m\x1B[38;2;83;167;202mh\x1B[39m\x1B[38;2;84;165;205mi\x1B[39m\x1B[38;2;85;162;208mn\x1B[39m\x1B[38;2;86;160;211mg\x1B[39m \x1B[38;2;87;158;215mg\x1B[39m\x1B[38;2;88;155;218mi\x1B[39m\x1B[38;2;89;153;221mt\x1B[39m \x1B[38;2;90;150;224mb\x1B[39m\x1B[38;2;91;148;227mr\x1B[39m\x1B[38;2;92;145;230ma\x1B[39m\x1B[38;2;93;143;233mn\x1B[39m\x1B[38;2;94;141;236mc\x1B[39m\x1B[38;2;95;138;239mh\x1B[39m\x1B[38;2;96;136;243me\x1B[39m\x1B[38;2;97;133;246ms\x1B[39m';

async function isGitDir(dirPath) {
    const gitDirPath = path.join(dirPath, '.git');

    return new Promise((resolve, reject) => {
        fs.stat(gitDirPath, async (err) => {
            if (err) {
              if (dirPath === '/') {
                resolve(false);
              } else {
                resolve(await isGitDir(path.dirname(dirPath)));
              }
            } else {
              resolve(true);
            }
        });
    });
}

async function pExec(command) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function hasSubSequence(str, subSequence) {
  let lastPos = 0;
  for (let i = 0; i < subSequence.length; i++) {
    let hasChar = false;
    for (let j = lastPos; j < str.length; j++) {
      if (subSequence[i] === str[j]) {
        hasChar = true;
        lastPos = j + 1;
        break;
      }
    }

    if (!hasChar) {
      return false;
    }
  }

  return true;
}

(async function () {
  console.log();
  console.log(gradientBanner);
  console.log();

  if (!await isGitDir(process.cwd())) {
    console.log(bold(red('The current folder is not a git repository.')));
    return;
  }

  const currentBranch = (await pExec('git branch --show-current')).trim();

  const branchList = await pExec('git branch --list');
  const branchesWithoutCurrent = branchList
    .split(OS.EOL)
    .map((br) => br.trim())
    .filter((br) => br && !/^\*/.test(br));
  const localBranches = [currentBranch, ...branchesWithoutCurrent];

  const result = await prompts([
    {
      type: 'autocomplete',
      name: 'targetBranch',
      message: bold(white('Please pick the new branch')),
      choices: localBranches.map(branch => ({
        title: branch === currentBranch ? lightGreen(`${branch}(Current)`) : white(branch),
        value: branch,
      })),
      initial: 0,
      suggest: (input, choices) => {
        return choices.filter(choice => {
          const lowerInput = input.toLowerCase();
          const lowerChoice = choice.value.toLowerCase();
          return hasSubSequence(lowerChoice, lowerInput);
        });
      },
    },
  ], {
    onCancel: (prompt) => {
      // ctrl + c
      console.log();
      console.log(bold(green(`⬅ ⬅ ⬅  Switch cancelled! `)));
      console.log();
      console.log(bold(green(`The current branch is ${lightYellow(currentBranch)}.`)));
      console.log();
    },
  });

  // cancel prompt
  if (!result.targetBranch) {
    return;
  }

  if (result.targetBranch !== currentBranch) {
    await pExec(`git checkout ${result.targetBranch}`);
    console.log();
    console.log(bold(green(`🚀🚀🚀 Switch Successfully! `)));
    console.log();
    console.log(bold(green(`The current branch is ${lightYellow(result.targetBranch)}.`)));
    console.log();
  } else {
    console.log();
    console.log(bold(red('❗️❗️❗️ The branch is not changed.')));
    console.log();
    console.log(bold(red(`The current branch is ${lightYellow(currentBranch)}.`)));
    console.log();
  }
})();
