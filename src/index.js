"use strict"

const path = require('path')
const _ = require('lodash')
const globby = require('globby')
const debug = require('debug')


const getProjectFiles = (dir, mask) => {
    return globby.sync(mask, {cwd: dir, realpath: true})
}

function getRecursiveFileDependencies(module, parsedModules, dir) {
    let deps = []
    if (parsedModules.indexOf(module.id) !== -1) {
        return deps
    }

    if (module.resource && module.resource.indexOf(dir) === -1){
        return deps
    }

    _.map(_.get(module, 'fileDependencies', []), (file)=>{
        debug('\tRequested ', file)
        deps.push(file)
    })
    _.map(module.dependencies, (dep) => {
        debug('Going inside', module.resource)
        if(dep.module) {
            deps = _.concat(deps, getRecursiveFileDependencies(dep.module, parsedModules.concat([module.id]), dir))
        }
    })
    return deps
}

function MintPlugin(options) {
    this.root = path.resolve(process.cwd(), options.root)
    this.mask = options.mask || ['**/*.js']
}

MintPlugin.prototype.apply = function(compiler) {
    const root = this.root
    const projectFiles = getProjectFiles(root, this.mask)
    let dependentFiles = []
    compiler.plugin('compilation', function(compilation, params) {
        compilation.plugin('record-chunks', function(chunks, rec) {
            _.map(chunks, (chunk) => {
                dependentFiles = dependentFiles.concat(getRecursiveFileDependencies(chunk.entryModule, [], root))
            })
            debug('Using files:')
            _.map(dependentFiles, (f)=>{
                debug(`\t* ${f}`)
            })
            debug('-----')

            const unusedFiles = _.difference(projectFiles, _.uniq(dependentFiles))
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
