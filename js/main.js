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

var FOOD_STORAGE_BUFFER_MULTIPLIER = 1.5 + 1.5 * Math.random();
var TIME_BETWEEN_MAGICAL_BIRTHS = 30;
var PROCESS_GATHERING_FOOD_NAME = "Gathering food";
var PROCESS_BUILD_SUPPLIES_NAME = "Searching for building supplies";
var PROCESS_BUILD_HOUSE_NAME = "Building a house";
var PROCESS_BUILD_FARM_NAME = "Raising a barn";

var timeSinceLastMagicalBirth = TIME_BETWEEN_MAGICAL_BIRTHS;
var yearsPassed = 0;
var hideAutomaticProcesses = false;
var focusPerson = -1;

/* Add some definitely male and female people so the people will survive at
 * least a while. Also a few randoms just for a bit of the random feel.
 * Also make sure at least 2 of them are probable to make offspring.
 */
var people = [
    new Person(undefined, undefined, undefined, "male", "opposite", WORKING_AGE + Math.random() * 5),
    new Person(undefined, undefined, undefined, "female", "opposite", WORKING_AGE + Math.random() * 5),
    new Person(undefined, undefined, undefined, "male", undefined, WORKING_AGE + Math.random() * 5),
    new Person(undefined, undefined, undefined, "female", undefined, WORKING_AGE + Math.random() * 5)
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
var farms = 4;
var currentFarmsToBeGatheredFrom = 0;
var historyEntries = [];
var processes = [];

function makePerson(father, mother) {
    var person = new Person(father, mother);
    people.push(person);
    historyEntries.push(person.getName() + " was just born!");
}

function canMagicalBirth() {
    return timeSinceLastMagicalBirth > TIME_BETWEEN_MAGICAL_BIRTHS;
}

function makePersonMagically() {
    if (canMagicalBirth()) {
        makePerson();
        if (people.length > 5) {
            timeSinceLastMagicalBirth = 0;
        }
    }
}

function gatherFood(automatic) {
    if (currentFarmsToBeGatheredFrom <= 0) {
        return;
    }
    currentFarmsToBeGatheredFrom--;
    var newProcess = new Process(PROCESS_GATHERING_FOOD_NAME, 900, 200, function () {resources.food++;}, automatic);
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function gatherBuild(automatic) {
    var newProcess = new Process(PROCESS_BUILD_SUPPLIES_NAME, 1250, 200, function () {resources.build++;}, automatic);
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function makeHouse(automatic) {
    if (resources.build < 5) {
        return;
    }
    resources.build -= 5;
    var newProcess = new Process(PROCESS_BUILD_HOUSE_NAME, 7500, 200, function () {houses.push(new House());}, automatic);
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function makeFarm(automatic) {
    if (resources.build < 2) {
        return;
    }
    resources.build -= 2;
    var newProcess = new Process(PROCESS_BUILD_FARM_NAME, 1000, 200, function () {farms++}, automatic);
    newProcess.assignWorker(people);
    processes.push(newProcess);
}

function toggleAutomaticWorks() {
    hideAutomaticProcesses = !hideAutomaticProcesses;
    if (hideAutomaticProcesses) {
        $("#hideAutoProcs").val("Show automatic works");
    } else {
        $("#hideAutoProcs").val("Hide automatic works");
    }
}

function focusPerson(personID) {
    focusPerson = personID;
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

function amtOfPopulatedHouses() {
    var houseIDs = [];
    for (var i = 0; i < people.length; i++) {
        if (people[i].house != -1 && houseIDs.indexOf(people[i].house) == -1 &&
                !people[i].isChild()) {
            houseIDs.push(people[i].house);
        }
    }
    return houseIDs.length;
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
    targetFood: function() {
        var total = 0;
        for (var i = 0; i < people.length; i++) {
            total += people[i].yearlyFoodConsumption();
        }
        if (this.currentFood < total * FOOD_STORAGE_BUFFER_MULTIPLIER) {
            total *= FOOD_STORAGE_BUFFER_MULTIPLIER;
        }
        return Math.ceil(total);
    }
};
function yearlyUpdate() {
    currentFarmsToBeGatheredFrom = farms;

    yearlyStats.currentFood = resources.food;
    var neededFood = yearlyStats.targetFood() - resources.food;
    var amt = amtOfWorkingPeople() * 2;
    if (neededFood > amt) {
        neededFood = amt;
    }
    if (neededFood < amtOfProcesses(PROCESS_GATHERING_FOOD_NAME)) {
        neededFood = 0;
    }
    for (var i = 0; i < Math.max(0, neededFood - currentFarmsToBeGatheredFrom); i++) {
        makeFarm(true);
    }
    for (var i = 0; i < neededFood; i++) {
        gatherFood(true);
    }

    if (yearlyStats.targetFood < yearlyStats.currentFood && // Make sure they don't die of hunger while making houses
            amtOfPopulatedHouses() < amtOfWorkingPeople() + amtOfElderPeople()) {
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

function updateFocus(person) {
    if ($("#person" + person.personID).length > 0 && $("#person" + person.personID).is(":hover")) {
        focusPerson = person.personID;
    }
}

function update(delta) {
    var lastYear = yearsPassed;
    yearsPassed += YEARS_PER_SECOND * delta;
    if (Math.floor(lastYear) != Math.floor(yearsPassed)) {
        yearlyUpdate();
    }

    timeSinceLastMagicalBirth += delta;

    for (var i = 0; i < people.length; i++) {
        updateFocus(people[i]);
        people[i].age += YEARS_PER_SECOND * delta;
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
var UPS = 30; // Game loops per second
var YEARS_PER_SECOND = 0.4;
var lastTime = Date.now();
var gameloopThread = new Worker("js/loopWorker.js");
gameloopThread.postMessage([UPS]);
gameloopThread.onmessage = function(data) {
    var nowTime = Date.now();
    update((nowTime - lastTime) / 1000.0);
    lastTime = nowTime;

    $("#makePerson").val("Make a person" +
        (canMagicalBirth() ? "" : " [" + (TIME_BETWEEN_MAGICAL_BIRTHS - timeSinceLastMagicalBirth).toFixed(1) + "s until next]"));

    var peopleParagraph = "<h3>People:</h3>";
    if (people.length == 0) {
        peopleParagraph += "<p>All of your people seem to have died. Refresh the page to restart!</p>";
    } else {
        peopleParagraph += "<ul>";
        for (var i = people.length - 1; i >= 0; i--) {
            peopleParagraph += "<li id='person" + people[i].personID + "'>" + people[i].getName();
            if (people[i].personID == focusPerson) {
                peopleParagraph += " (" + people[i].getSexualityLetter() +
                    "):<br>&nbsp&nbspAge: " + Math.floor(people[i].age) +
                    "<br>&nbsp&nbspSex: " + people[i].sex +
                    (!people[i].father.exists ? "" : "<br>&nbsp&nbspFather: " + people[i].father.getName()) +
                    (!people[i].mother.exists ? "" : "<br>&nbsp&nbspMother: " + people[i].mother.getName()) +
                    (people[i].hunger == 0 ? "" : "<br>&nbsp&nbspHunger level: " + people[i].hunger.toFixed(2)) +
                    (!people[i].inRelationshipWith.exists ? "" : "<br>&nbsp&nbspIn a relationship with: " + people[i].inRelationshipWith.getName()) +
                    (people[i].work == "" ? "" : "<br>&nbsp&nbspCurrently working on: " + people[i].work);
            }
            peopleParagraph += "</li><br>";
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
    resourceParagraph += "<li>Year: " + Math.floor(yearsPassed) + "</li>";
    resourceParagraph += "<li>Population: " + people.length + "<ul>";
    resourceParagraph += "<li>Children: " + amtOfYoungPeople() + "</li>";
    resourceParagraph += "<li>Adults: " + amtOfWorkingPeople() + "</li>";
    resourceParagraph += "<li>Elders: " + amtOfElderPeople() + "</li>";
    resourceParagraph += "</ul></li>";
    resourceParagraph += "<li>Farms: " + farms + "<ul>";
    resourceParagraph += "<li>Unattended farms: " + currentFarmsToBeGatheredFrom + "</li>";
    resourceParagraph += "</ul></li>";
    resourceParagraph += "<li>Houses: " + houses.length + "<ul>";
    resourceParagraph += "<li>Unoccupied houses: " + (houses.length - amtOfPopulatedHouses()) + "</li>";
    resourceParagraph += "</ul></li>";
    var totalHunger = 0;
    for (var i = 0; i < people.length; i++) {
        totalHunger += people[i].hunger;
    }
    var avgHunger = totalHunger / people.length;
    resourceParagraph += (avgHunger > 0 ? "<li>Average hunger: " + avgHunger.toFixed(1) + "</li>" : "");
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

    focusPerson = -1;
    $("#peopleSheet").html(peopleParagraph);
    $("#resources").html(resourceParagraph);
    $("#processes").html(processesParagraph);
    $("#history").html(historyParagraph);
    gameloopThread.postMessage([UPS]);
}
