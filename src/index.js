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

MintPlugin.prototype.apply = function(compiler) {
    const root = this.root
    const projectFiles = getProjectFiles(root, this.mask)
    compiler.plugin('compilation', function(compilation, params) {
        compilation.plugin('after-optimize-chunk-assets', function(chunks) {

            debug('Using files:')
            _.map(compilation.fileDependencies, (f)=>{
                debug(`\t* ${f}`)
            })
            debug('-----')

            const unusedFiles = _.difference(projectFiles, compilation.fileDependencies)
            if(!_.isEmpty(unusedFiles)){
                console.log('[Mint] Found unused files:')
                _.map(unusedFiles, (f)=>{
                    console.log(`\t* ${f}`)
                })
                console.log('')
            }
        })
    })
}

module.exports = MintPlugin
