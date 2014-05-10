"use strict";

var split = require("split");
module.exports = getTargets;

/**
 * Get targets and their goals
 *
 * @param {ReadableStream} stream
 * @param {Function} callback
 */
function getTargets(stream, callback) {
    
    // Found targets
    var targets = {};
    
    stream.pipe(split()) // Split stream into single lines
        .on("data", function(line) {
            
            // Test for target definition
            if(!/^[^ ]*: /.test(line)) return;
            
            // Extract target name and goals
            var parts = line.split(":"),
                target = parts[0].trim(),
                goals = parts[1].split(" ").map(function(a) {
                    return a.trim(); // Trim every goal
                }).filter(function(a) {
                    return a.length > 0; // Filter out empty goals
                });
            
            // Add the target
            if(goals.length > 0) targets[target] = goals;
        })
        .on("end", function() {
            
            callback(null, targets);
            
        });
    
}
