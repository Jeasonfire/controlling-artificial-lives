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

var TIME_PASSED_PER_SECOND = 0.5;
var people = [];
var resources = {
    food: 0,
    build: 0
}
var historyEntries = [];

function makePerson() {
    var person = new Person();
    if (people.length >= 2) {
        var fathersIndex = Math.floor(Math.random() * people.length);
        var mothersIndex = Math.floor(Math.random() * people.length);
        person = new Person(people[fathersIndex], people[mothersIndex]);
    }
    people.push(person);
    historyEntries.push(person.getName() + " was just born!");
}

function gatherFood() {
    resources.food++;
}

function gatherBuild() {
    resources.build++;
}

function update(delta) {
    for (var i = 0; i < people.length; i++) {
        var lastAge = people[i].age;
        people[i].age += delta * TIME_PASSED_PER_SECOND;
        if (Math.floor(lastAge / 10.0) != Math.floor(people[i].age / 10.0)) {
            historyEntries.push(people[i].getName() + " just turned " + Math.round(people[i].age) + "!");
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

    var peopleParagraph = "<ul>";
    for (var i = people.length - 1; i >= 0; i--) {
        peopleParagraph += "<li>" + people[i].getName() + ":<br>&nbsp&nbspAge: " + people[i].age.toFixed(1) + "<br>&nbsp&nbspSex: " + people[i].sex + "</li><br>";
    }
    peopleParagraph += "</ul>";

    var resourceParagraph = "<p><ul><li>Food: " + resources.food + "</li><li>Build: " + resources.build + "</li></ul></p>";

    var historyParagraph = "<ul>";
    for (var i = historyEntries.length - 1; i >= 0; i--) {
        historyParagraph += "<li>" + historyEntries[i] + "</li>";
    }
    historyParagraph += "</ul>";

    document.getElementById("peopleSheet").innerHTML = peopleParagraph;
    document.getElementById("resources").innerHTML = resourceParagraph;
    document.getElementById("history").innerHTML = historyParagraph;
    gameloopThread.postMessage([UPS]);
}
