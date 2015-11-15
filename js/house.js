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

var houseIDs = 0;

function House() {
    this.person0 = new Person(undefined, undefined, false);
    this.person1 = new Person(undefined, undefined, false);
    this.houseID = ++houseIDs;
}

House.prototype = {
    getDescription: function() {
        if (!this.person0.exists && !this.person1.exists) {
            return "An empty house";
        } else if (this.person0.exists && !this.person1.exists) {
            return this.person0.getName() + "'s house";
        } else if (!this.person0.exists && this.person1.exists) {
            return this.person1.getName() + "'s house";
        } else {
            return this.person0.getName() + "'s and " + this.person1.getName() + "'s house";
        }
    },

    assignHouseFor: function(person) {
        if (person.house == -1 && this.hasRoom()) {
            if (person.inRelationshipWith.exists && person.inRelationshipWith.house != -1) {
                return false;
            }
            person.house = this.houseID;
            person.inRelationshipWith.house = this.houseID;
            return true;
        } else {
            return false;
        }
    },

    hasRoom: function() {
        return !this.person0.exists && !this.person1.exists;
    },

    updateInhabitant: function(person) {
        if (person.house == this.houseID && this.person0 != person && this.person1 != person) {
            if (this.person0.exists) {
                this.person1 = person;
            } else {
                this.person0 = person;
            }
        }
        if (person.house != this.houseID) {
            if (this.person0 == person) {
                this.person0 = new Person(undefined, undefined, false);
            }
            if (this.person1 == person) {
                this.person1 = new Person(undefined, undefined, false);
            }
        }
    }
}
