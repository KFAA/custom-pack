#!/usr/bin/env node
//  标识  指定主程序执行环境为  node
const path = require('path')
const config = require(path.resolve('config.js')) // 项目根目录配置文件

/**  读取需要打包项目的配置文件 */
const Bundle = require("../lib/Bundle")
new Bundle(config).run()