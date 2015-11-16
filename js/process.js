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

function Process(name, time, degreeOfVariance, onFinish, automatic) {
    if (degreeOfVariance === undefined) {
        degreeOfVariance = 0;
    }
    this.time = time + Math.random() * degreeOfVariance * 2 - degreeOfVariance;
    this.name = name;
    this.startingTime = -1;
    this.worker = null;
    this.onFinish = onFinish;
    this.automatic = automatic !== undefined ? automatic : false;
}

Process.prototype = {
    getDescription: function () {
        return this.name + " [" + (this.worker == null ? "NOBODY" : this.worker.getName()) + "]";
    },

    assignWorker: function(people) {
        var indices = [];
        for (var i = 0; i < people.length; i++) {
            indices.push(i);
        }
        indices.sort(function() {return 0.5 - Math.random()});
        for (var i = 0; i < indices.length; i++) {
            if (people[indices[i]].eligibleForWork()) {
                people[indices[i]].work = this.name;
                this.worker = people[indices[i]];
                this.startingTime = Date.now();
                return;
            }
        }
    },

    isDone: function() {
        if (this.startingTime > 0 && Date.now() - this.startingTime >= this.time && this.worker.work != "") {
            this.worker.work = "";
            this.onFinish();
            return true;
        } else {
            return false;
        }
    },

    progress: function() {
        return this.startingTime == -1 ? 0 : (Date.now() - this.startingTime) / this.time;
    }
}
