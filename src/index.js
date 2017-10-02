"use strict"

const path = require('path')
const _ = require('lodash')
const globby = require('globby')
const debug = require('debug')('mint')


const getProjectFiles = (dir, mask) => {
    return globby.sync(mask, {cwd: dir, realpath: true})
}

function MintPlugin(options) {
    this.root = path.resolve(process.cwd(), options.root)
    this.mask = options.mask || ['**/*.js']
}

MintPlugin.prototype.apply = function (compiler) {
    const root = this.root
    let projectFiles = getProjectFiles(root, this.mask)

    if (compiler.options.externals) {
        const ext = compiler.options.externals

        _.remove(projectFiles, (file) => {
            // fixme: manually converting file paths to webpack import format
            let fileName = file
            const fileExtension = '.'+_.last(file.split('.'))
            if (_.includes(_.get(compiler, 'options.resolve.extensions', []), fileExtension)) {
                fileName = file.split('.')[0]
            }
            const webpackedPath = './' + path.relative(path.dirname(root), fileName)
                .replace(new RegExp('\\' + path.sep, 'g'), '/')
            // end of fixme

            let isExternal = true
            if (typeof ext === "string") {
                isExternal = (ext === webpackedPath)
            } else if (Array.isArray(ext)) {
                isExternal = _.includes(ext, webpackedPath)
            } else if (ext instanceof RegExp) {
                isExternal = ext.test(webpackedPath)
            } else if (typeof ext === 'function') {
                isExternal = ext(null, webpackedPath, (c, v) => v)
            }
            debug(`${webpackedPath} is treated as ${isExternal ? 'external' : 'internal'}`)
            return isExternal
        })
    }

    compiler.plugin('compilation', function (compilation, params) {
        compilation.plugin('after-optimize-chunk-assets', function (chunks) {

            debug('Using files:')
            _.map(compilation.fileDependencies, (f) => {
                debug(`\t* ${f}`)
            })
            debug('-----')

            const unusedFiles = _.difference(projectFiles, compilation.fileDependencies)
            if (!_.isEmpty(unusedFiles)) {
                let report = '[ Mint ]\nFound unused files:\n'
                _.map(unusedFiles, (f) => {
                    report += `\t* ${f}\n`
                })
                compilation.warnings.push(report)
            }
        })
    })
}

module.exports = MintPlugin
