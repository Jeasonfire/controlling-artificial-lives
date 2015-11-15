/*
 *  Copyright (C) 2015  Jeasonfire
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var AGE_PER_SECOND = 0.5;
var people = [];
var resources = {
    food: 0,
    build: 0
}
var historyEntries = [];
var processes = [];

function makePerson() {
    var person = new Person();
    if (people.length >= 2) {
        var fathersIndex = Math.floor(Math.random() * people.length);
        var mothersIndex = Math.floor(Math.random() * people.length);
        person = new Person(people[fathersIndex], people[mothersIndex]);
    }
    people.push(person);
    historyEntries.push("<b>" + person.getName() + "</b> was just born!");
}

function gatherFood() {
    var newProcess = new Process("Gathering food", 4000, 200, function () {resources.food++;});
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function gatherBuild() {
    var newProcess = new Process("Searching for building supplies", 10000, 200, function () {resources.build++;});
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function update(delta) {
    for (var i = 0; i < people.length; i++) {
        var lastAge = people[i].age;
        people[i].age += delta * AGE_PER_SECOND;
        if (Math.floor(lastAge / 10.0) != Math.floor(people[i].age / 10.0)) {
            historyEntries.push("<b>" + people[i].getName() + "</b> just turned " + Math.round(people[i].age) + "!");
        }
    }
}

/* The game loop code (a very hacky loop system that works on its own thread with a worker) */
var UPS = 20; // Game loops per second
var lastTime = Date.now();
var gameloopThread = new Worker("/js/loopWorker.js");
gameloopThread.postMessage([UPS]);
gameloopThread.onmessage = function(data) {
    var nowTime = Date.now();
    update((nowTime - lastTime) / 1000.0);
    lastTime = nowTime;

    var peopleParagraph = "<h3>People:</h3><ul>";
    for (var i = people.length - 1; i >= 0; i--) {
        peopleParagraph += "<li><b>" + people[i].getName() + "</b>:<br>&nbsp&nbspAge: " + people[i].age.toFixed(1) +
            "<br>&nbsp&nbspSex: " + people[i].sex +
            (people[i].work == "" ? "" : "<br>&nbsp&nbspCurrently working on: " + people[i].work) + "</li><br>";
    }
    peopleParagraph += "</ul>";

    var resourceParagraph = "<h3>Resources:</h3><p><ul><li><b>Food</b>: " + resources.food + "</li><li><b>Build</b>: " + resources.build + "</li></ul></p>";

    var processesParagraph = "<h3>Current works:</h3><ul>";
    for (var i = 0; i < processes.length; i++) {
        if (!processes[i].isDone()) {
            var progressBar = "";
            for (var j = 0; j < 10; j++) {
                if (j / 10.0 < processes[i].progress()) {
                    progressBar += "=";
                } else {
                    progressBar += "&nbsp";
                }
            }
            processesParagraph += "<li>" + processes[i].getDescription() + ":<br>&nbsp&nbsp[" + progressBar + "]</li><br>";
            if (processes[i].worker == null) {
                processes[i].assignWorker(people);
            }
        } else {
            historyEntries.push("<b>" + processes[i].worker.getName() + "</b> finished work: <i>" + processes[i].name + "</i>");
            processes.splice(i, 1);
        }
    }
    processesParagraph += "</ul>";

    var historyParagraph = "<h3>History:</h3><ul>";
    for (var i = historyEntries.length - 1; i >= 0; i--) {
        historyParagraph += "<li>" + historyEntries[i] + "</li><br>";
    }
    historyParagraph += "</ul>";

    document.getElementById("peopleSheet").innerHTML = peopleParagraph;
    document.getElementById("resources").innerHTML = resourceParagraph;
    document.getElementById("processes").innerHTML = processesParagraph;
    document.getElementById("history").innerHTML = historyParagraph;
    gameloopThread.postMessage([UPS]);
}
