
const path = require("path")
const fs = require("fs")
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const ejs = require('ejs')
class Bundle {
    constructor(config) {
        this.config = config
        this.entry = config.entry
        this.root = process.cwd()
        this.modules = {}
    }
    /**        读取入口文件内容           */
    getFile(entryPath) {
        return fs.readFileSync(entryPath, "utf-8")
    }
    /**       解析入口文件         */
    relyParse(entryPath) {
        let content = this.getFile(entryPath)
        let relys = []
        /**  将JS 代码转换为 AST 语法树 */
        let AST = parser.parse(content)
        /**  解析 AST 语法树 */
        traverse(AST, {
            CallExpression(nodePath) {
                if (nodePath.node.callee.name) {
                    /** 浏览器不识别require语法 替换 require语法 */
                    nodePath.node.callee.name = "_custom_require"
                    let value = nodePath.node.arguments[0].value 
                    value = "./" + path.join("src", value)
                    /** 重写 require语法后面的路径 */
                    nodePath.node.arguments[0].value  = value.replace(/\\+/g, '/')
                    relys.push(nodePath.node.arguments[0].value)

                }
            }
        })
        /**  解析模块的相对路径 */
        let moduleRelativePath = "./" + path.relative(this.root,entryPath).replace(/\\+/g, "/")

        /** 解析 替换require语法后的 AST语法树 */
        let newCode = generator(AST).code

        /** 组装模块对象 */
        this.modules[moduleRelativePath] = newCode
        /** 递归 解析所有的 require 语法 */
        relys.forEach( rely => this.relyParse(path.resolve(this.root, rely)))
    }
    emitFile(){
        let template = this.getFile(path.join(__dirname,'./template.ejs'))
        let result = ejs.render(template,{
            entry: this.entry,
            modules: this.modules
        })
        /** 文件输出路径 */
        let output = path.join(this.config.output.path, this.config.output.filename)
        fs.writeFileSync(output,result)
    }
    run() {
        this.relyParse(path.resolve(this.root, this.entry))
        this.emitFile()
    }
}
module.exports = Bundle