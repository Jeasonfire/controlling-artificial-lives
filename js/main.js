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

var YEARS_PER_SECOND = 0.1;
var FOOD_STORAGE_BUFFER_MULTIPLIER = 1.5 + 1.5 * Math.random();
var PROCESS_GATHERING_FOOD_NAME = "Gathering food";
var PROCESS_BUILD_SUPPLIES_NAME = "Searching for building supplies";
var PROCESS_BUILD_HOUSE_NAME = "Building a house";

var yearsPassed = 0;
var hideAutomaticProcesses = true;

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

function gatherFood(automatic) {
    var newProcess = new Process(PROCESS_GATHERING_FOOD_NAME, (1.0 / YEARS_PER_SECOND) * 900, 200, function () {resources.food++;}, automatic);
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function gatherBuild(automatic) {
    var newProcess = new Process(PROCESS_BUILD_SUPPLIES_NAME, (1.0 / YEARS_PER_SECOND) * 1250, 200, function () {resources.build++;}, automatic);
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function makeHouse(automatic) {
    if (resources.build < 5) {
        return;
    }
    resources.build -= 5;
    var newProcess = new Process(PROCESS_BUILD_HOUSE_NAME, (1.0 / YEARS_PER_SECOND) * 7500, 200, function () {houses.push(new House());}, automatic);
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function toggleAutomaticWorks() {
    hideAutomaticProcesses = !hideAutomaticProcesses;
    if (hideAutomaticProcesses) {
        document.getElementById("hideAutoProcs").value = "Show automatic works";
    } else {
        document.getElementById("hideAutoProcs").value = "Hide automatic works";
    }
}

function removePerson(person) {
    for (var i = 0; i < people.length; i++) {
        if (people[i] == person) {
            people.splice(i, 1);
        }
    }
}

function amtOfYoungPeople() {
    var result = 0;
    for (var i = 0; i < people.length; i++) {
        if (people[i].isChild()) {
            result++;
        }
    }
    return result;
}

function amtOfWorkingPeople() {
    var result = 0;
    for (var i = 0; i < people.length; i++) {
        if (!people[i].isChild() && !people[i].isOld()) {
            result++;
        }
    }
    return result;
}

function amtOfElderPeople() {
    var result = 0;
    for (var i = 0; i < people.length; i++) {
        if (people[i].isOld()) {
            result++;
        }
    }
    return result;
}

function isThereHomelessPeople() {
    for (var i = 0; i < people.length; i++) {
        if (people[i].house == -1 && !people[i].isChild()) {
            return true;
        }
    }
    return false;
}

function amtOfProcesses(type) {
    var result = 0;
    for (var i = 0; i < processes.length; i++) {
        if (processes[i].name == type) {
            result++;
        }
    }
    return result;
}

var yearlyStats = {
    currentFood: resources.food,
    targetFood: 0,
    updateTargetFood: function() {
        var total = 0;
        for (var i = 0; i < people.length; i++) {
            total += people[i].foodConsumption();
        }
        if (this.currentFood < total * FOOD_STORAGE_BUFFER_MULTIPLIER) {
            total *= FOOD_STORAGE_BUFFER_MULTIPLIER;
        }
        this.targetFood = total;
    }
};
function yearlyUpdate() {
    yearlyStats.currentFood = resources.food;
    yearlyStats.updateTargetFood();
    var neededFood = 0;
    if (yearlyStats.targetFood > yearlyStats.currentFood) {
        neededFood = Math.ceil(yearlyStats.targetFood);
        var amt = amtOfWorkingPeople() * 2;
        if (neededFood > amt) {
            neededFood = amt;
        }
        if (neededFood < amtOfProcesses(PROCESS_GATHERING_FOOD_NAME)) {
            neededFood = 0;
        }
    }
    for (var i = 0; i < neededFood; i++) {
        gatherFood(true);
    }

    if (isThereHomelessPeople()) {
        if (resources.build < 5) {
            for (var i = 0; i < Math.ceil(Math.max(0, people.length / 3)) &&
                    resources.build + amtOfProcesses(PROCESS_BUILD_SUPPLIES_NAME) < 5; i++) {
                gatherBuild(true);
            }
        } else {
            makeHouse(true);
        }
    }
}

function update(delta) {
    var lastYear = yearsPassed;
    yearsPassed += YEARS_PER_SECOND * delta;
    if (Math.floor(lastYear) != Math.floor(yearsPassed)) {
        yearlyUpdate();
    }

    for (var i = 0; i < people.length; i++) {
        people[i].age += YEARS_PER_SECOND * delta;
        if (resources.food >= people[i].foodConsumption() * delta) {
            resources.food -= people[i].foodConsumption() * YEARS_PER_SECOND * delta;
            if (resources.food > 0 && people[i].hunger > 0) {
                var amt = Math.min(resources.food, people[i].hunger);
                people[i].hunger -= amt;
                resources.food -= amt;
            }
        } else {
            people[i].hunger += people[i].foodConsumption() * YEARS_PER_SECOND * delta;
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
var gameloopThread = new Worker("js/loopWorker.js");
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
            peopleParagraph += "<li>" + people[i].getName() + ":<br>&nbsp&nbspAge: " + Math.floor(people[i].age) +
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
    resourceParagraph += "<h3>Misc. stats:</h3><ul>";
    resourceParagraph += "<li>Population: " + people.length + "<ul>";
    resourceParagraph += "<li>Child pop.: " + amtOfYoungPeople() + "</li>";
    resourceParagraph += "<li>Working pop.: " + amtOfWorkingPeople() + "</li>";
    resourceParagraph += "<li>Elder pop.: " + amtOfElderPeople() + "</li>";
    resourceParagraph += "</ul></li><li>Year: " + Math.floor(yearsPassed) + "</li>";
    resourceParagraph += "</ul>";

    var processesParagraph = "<h3>Current works:</h3><ul>";
    for (var i = 0; i < processes.length; i++) {
        var skipWriting = !(hideAutomaticProcesses && processes[i].automatic);
        if (!processes[i].isDone() && (!processes[i].worker.exists || (processes[i].worker.exists && processes[i].worker.exists))) {
            var progressBar = "";
            for (var j = 0; j < 10; j++) {
                if (j / 10.0 < processes[i].progress()) {
                    progressBar += "=";
                } else {
                    progressBar += "&nbsp";
                }
            }
            if (skipWriting) {
                processesParagraph += "<li>" + processes[i].getDescription() + ":<br>&nbsp&nbsp[" + progressBar + "]</li><br>";
            }
            if (!processes[i].worker.exists) {
                processes[i].assignWorker(people);
            }
        } else if (processes[i].worker.exists && !processes[i].worker.exists) {
            historyEntries.push("The worker died. Work interrupted: <i>" + processes[i].name + "</i>");
            processes.splice(i, 1);
        } else {
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
