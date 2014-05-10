#!/usr/bin/env node

"use strict";

var getTargets = require("./parser"),
    spawn = require("child_process").spawn,
    watch = require("glob-watcher"),
    program = require("commander"),
    colors = require("colors"),
    path = require("path"),
    fs = require("fs"),
    log = console.log;

program
    .version(require("../package.json").version)
    .option("-f, --make-database <file>", "output from `make -pn`")
    .option("-d, --directory <dir>", "directory to use as cwd")
    .option("-i, --include <list>", "comma-seperated list with whitelisted targets", list)
    .option("-e, --exclude <list>", "comma-seperated list with blacklisted targets", list)

    .parse(process.argv);

// Get cwd
var cwd = process.cwd();
if(program.directory) {
    cwd = path.join(cwd, program.directory);
}

log("Using '%s' as cwd.", cwd.grey);

// Obtain make's database
var stream;
if(program.makeDatabase) {
    var dbPath = path.join(cwd, program.makeDatabase);
    
    log("Getting database from '%s'.", dbPath.grey);
    
    stream = fs.createReadStream(dbPath);
    
} else {
    
    log("Getting database from '%s'.", "make -pn".grey);
    
    var child = spawn("make", [ "-pn" ], {
        cwd: cwd
    });
    
    stream = child.stdout;
    
}

// Get targets
getTargets(stream, function(err, targets) {
    
    // Filter out targets
    targets = filterTargets(targets, program.include || [], program.exclude || []);
    
    var targetsArr = Object.keys(targets);
    log("Found %d targets: %s", targetsArr.length, targetsArr.join(", ").grey);
    
    // Iterate through targets
    Object.keys(targets).forEach(function(target) {
        var goals = targets[target];
        
        log("Target '%s' started watching...", target.grey);
        
        // Watch files in cwd
        watch(goals, { cwd: cwd }, function(event) {
            
            log();
            log("\tFile '%s' changed. Rerunning '%s'...", event.path.green, target.grey);
            log();
            
            spawn("make", [ target, "-B" ], {
                stdio: "inherit",
                cwd: cwd
            });
            
        });
    });
});

/**
 * Split a string into array for commander
 *
 * @param {String} a
 * @return {Array}
 */
function list(a) {
    return a.split(",");
}

function filterTargets(targets, include, exclude) {
    
    var newTargets = {};
    
    if(include.length > 0) {
        for(var i in targets) {
            if(include.indexOf(i) !== -1) {
                newTargets[i] = targets[i];
            }
        }
    } else if(exclude.length > 0) {
        for(var i in targets) {
            if(exclude.indexOf(i) == -1) {
                newTargets[i] = targets[i];
            }
        }
    } else {
        return targets;
    }
    
    return newTargets;
    
}