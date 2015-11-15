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
/* Add some definitely male and female people so the people will survive at
 * least a while. Also a few randoms just for a bit of the random feel.
 * Also make sure at least 2 of them are probable to make offspring.
 */
var people = [
    new Person(undefined, undefined, undefined, "male", "opposite", WORKING_AGE + Math.random() * 5),
    new Person(undefined, undefined, undefined, "female", "opposite", WORKING_AGE + Math.random() * 5),
    new Person(undefined, undefined, undefined, "male", undefined, WORKING_AGE + Math.random() * 5),
    new Person(undefined, undefined, undefined, "female", undefined, WORKING_AGE + Math.random() * 5),
    new Person(undefined, undefined, undefined, undefined, undefined, 10 + Math.random() * 15),
    new Person(undefined, undefined, undefined, undefined, undefined, 10 + Math.random() * 15),
    new Person(undefined, undefined, undefined, undefined, undefined, 10 + Math.random() * 15)
];
// Shuffle the list to obfuscate pre-made rolls
people.sort(function() {return 9.5 - Math.random()});

var resources = {
    food: 10,
    build: 10
}
var houses = [
    new House(),
    new House(),
    new House(),
    new House()
];
var historyEntries = [];
var processes = [];

function makePerson(father, mother) {
    var person = new Person(father, mother);
    people.push(person);
    historyEntries.push(person.getName() + " was just born!");
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

function makeHouse() {
    if (resources.build < 5) {
        return;
    }
    resources.build -= 5;
    var newProcess = new Process("Making a house", 40000, 200, function () {houses.push(new House());});
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function removePerson(person) {
    for (var i = 0; i < people.length; i++) {
        if (people[i] == person) {
            people.splice(i, 1);
        }
    }
}

function update(delta) {
    for (var i = 0; i < people.length; i++) {
        people[i].age += AGE_PER_SECOND * delta;
        if (resources.food >= people[i].foodConsumption() * delta) {
            resources.food -= people[i].foodConsumption() * delta;
            if (resources.food > 0 && people[i].hunger > 0) {
                var amt = Math.min(resources.food, people[i].hunger);
                people[i].hunger -= amt;
                resources.food -= amt;
            }
        } else {
            people[i].hunger += people[i].foodConsumption() * delta;
        }
        for (var j = 0; j < houses.length; j++) {
            houses[j].assignHouseFor(people[i]);
            houses[j].updateInhabitant(people[i]);
        }
        activateEvent(delta, people[i]);
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

    var peopleParagraph = "<h3>People:</h3>";
    if (people.length == 0) {
        peopleParagraph += "<p>All of your people seem to have died. Refresh the page to restart!</p>";
    } else {
        peopleParagraph += "<ul>";
        for (var i = people.length - 1; i >= 0; i--) {
            peopleParagraph += "<li>" + people[i].getName() + ":<br>&nbsp&nbspAge: " + people[i].age.toFixed(0) +
                "<br>&nbsp&nbspSex: " + people[i].sex +
                (!people[i].father.exists ? "" : "<br>&nbsp&nbspFather: " + people[i].father.getName()) +
                (!people[i].mother.exists ? "" : "<br>&nbsp&nbspMother: " + people[i].mother.getName()) +
                (people[i].hunger == 0 ? "" : "<br>&nbsp&nbspHunger level: " + people[i].hunger.toFixed(2)) +
                (!people[i].inRelationshipWith.exists ? "" : "<br>&nbsp&nbspIn a relationship with: " + people[i].inRelationshipWith.getName()) +
                (people[i].work == "" ? "" : "<br>&nbsp&nbspCurrently working on: " + people[i].work) + "</li><br>";
        }
        peopleParagraph += "</ul>";
    }

    var resourceParagraph = "<h3>Resources:</h3><p><ul><li><b>Food</b>: " + resources.food.toFixed(1) + "</li><li><b>Build</b>: " + resources.build.toFixed(1) + "</li></ul></p>";
    resourceParagraph += "<h3>Buildings:</h3><ul>";
    for (var i = 0; i < houses.length; i++) {
        resourceParagraph += "<li>" + houses[i].getDescription() + "</li>"
    }
    resourceParagraph += "</ul>";

    var processesParagraph = "<h3>Current works:</h3><ul>";
    for (var i = 0; i < processes.length; i++) {
        if (!processes[i].isDone() && (processes[i].worker === null || (processes[i].worker !== null && processes[i].worker.exists))) {
            var progressBar = "";
            for (var j = 0; j < 10; j++) {
                if (j / 10.0 < processes[i].progress()) {
                    progressBar += "=";
                } else {
                    progressBar += "&nbsp";
                }
            }
            processesParagraph += "<li>" + processes[i].getDescription() + ":<br>&nbsp&nbsp[" + progressBar + "]</li><br>";
            if (processes[i].worker === null) {
                processes[i].assignWorker(people);
            }
        } else if (processes[i].worker !== null && !processes[i].worker.exists) {
            historyEntries.push("The worker died. Work interrupted: <i>" + processes[i].name + "</i>");
            processes.splice(i, 1);
        } else {
            historyEntries.push(processes[i].worker.getName() + " finished work: <i>" + processes[i].name + "</i>");
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
