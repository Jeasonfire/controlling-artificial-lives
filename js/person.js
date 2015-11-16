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

var VOWELS = ["A", "E", "I", "O", "U", "Y"];
var CONSONANTS = ["B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P",
    "Q", "R", "S", "T", "V", "W", "X", "Z"];
var REPEATABLE_CONSTANTS = ["B", "D", "G", "K", "L", "M", "P", "R", "S", "T", "Z"];
/*
 * These letter frequencies are based on a wikipedia article
 * (https://en.wikipedia.org/wiki/Letter_frequency). The values are the
 * percentages in the "Relative frequencies of letters in the English language"
 * table * 10. This of course probably varies from the frequency of letters in
 * names, but eh.
 */
var LETTER_FREQUENCIES = {
    "A": 82, "B": 15, "C": 28, "D": 43, "E": 127, "F": 22, "G": 20, "H": 60,
    "I": 70, "J": 2, "K": 8, "L": 40, "M": 24, "N": 67, "O": 75, "P": 19,
    "Q": 1, "R": 60, "S": 63, "T": 90, "U": 28, "V": 10, "W": 24, "X": 2,
    "Y": 20, "Z": 1
};
var VOWELS_WITH_FREQ = [];
for (var i = 0; i < VOWELS.length; i++) {
    for (var j = 0; j < LETTER_FREQUENCIES[VOWELS[i]]; j++) {
        VOWELS_WITH_FREQ.push(VOWELS[i]);
    }
}
var CONSONANTS_WITH_FREQ = [];
for (var i = 0; i < CONSONANTS.length; i++) {
    for (var j = 0; j < LETTER_FREQUENCIES[CONSONANTS[i]]; j++) {
        CONSONANTS_WITH_FREQ.push(CONSONANTS[i]);
    }
}

// TODO: Add more of these
var SURNAME_SUFFIXES = ["ian", "en", "ell", "er", "ly"];

var WORKING_AGE = 14 + Math.round(Math.random() * 6);
var ELDER_AGE = 55 + Math.round(Math.random() * 30);

var MAX_FOOD_CONSUMPTION = 0.4 + 0.2 * Math.random() * Math.random();
var MAX_HUNGER_LEVEL = MAX_FOOD_CONSUMPTION + 0.5 * Math.random();

function Person(father, mother, exists, sex, sexuality, age) {
    if (exists === undefined) {
        this.exists = true;
    } else {
        this.exists = exists;
        if (!exists) {
            return;
        }
    }
    this.age = age !== undefined ? age : 0;
    this.confidence = Math.random();
    this.hunger = 0;
    this.house = -1;
    this.sex = sex !== undefined ? sex : Math.random() < 0.5 ? "male" : "female";
    this.work = "";
    this.workEfficiency = 0.25 + Math.random() * 0.5;
    this.divorce();
    this.sexuality = sexuality !== undefined ? sexuality : Math.random() < 0.85
        ? "opposite" : Math.random() < 0.5 ? "any" : Math.random() < 0.85 ? "same" : "none";
    this.name = this.generateFirstName();
    this.surname = this.generateSurname(father, mother);
    this.father = father !== undefined ? father : new Person("", "", false, "male");
    this.mother = mother !== undefined ? mother : new Person("", "", false, "female");
}

Person.prototype = {
    getName: function() {
        if (!this.exists) {
            return "";
        }
        return "<em style='color:" + (this.sex == "male" ? "cyan" : "orange") + ";'>" + this.name + (this.surname != "" ? " " + this.surname : "") + "</em>";
    },

    eligibleForWork: function() {
        if (!this.exists) {
            return false;
        }
        return !this.isChild() && !this.isOld() && this.work == "";
    },

    getInRelationShipWith: function(otherPerson) {
        if (otherPerson.house != -1) {
            this.house = otherPerson.house;
        }
        if (this.surname != "" && otherPerson.surname != "") {
            this.surname = otherPerson.surname;
        } else {
            var father = this.sex == "male";
            this.surname = this.generateSurname(father ? this : otherPerson,
                father ? otherPerson : this);
        }
        this.inRelationshipWith = otherPerson;
    },

    divorce: function() {
        this.inRelationshipWith = new Person("", "", false);
    },

    foodConsumption: function() {
        return MAX_FOOD_CONSUMPTION * (1.0 - Math.abs(Math.min(this.age, ELDER_AGE) - ELDER_AGE / 2.0) / (ELDER_AGE + 1.0));
    },

    isChild: function() {
        if (!this.exists) {
            return false;
        }
        return this.age < WORKING_AGE;
    },

    isOld: function() {
        if (!this.exists) {
            return false;
        }
        return this.age > ELDER_AGE;
    },

    generateFirstName: function() {
        if (!this.exists) {
            return "";
        }
        var consonants = [];
        for (var i = 0; i < 3; i++) {
            consonants.push(CONSONANTS_WITH_FREQ[Math.floor(Math.random() * CONSONANTS_WITH_FREQ.length)]);
            if (REPEATABLE_CONSTANTS.indexOf(consonants[i]) != -1 && Math.random() < 0.35 && i != 0) {
                consonants[i] = consonants[i] + consonants[i];
            }
        }
        var vowels = [];
        for (var i = 0; i < 2; i++) {
            vowels.push(VOWELS_WITH_FREQ[Math.floor(Math.random() * VOWELS_WITH_FREQ.length)]);
            if (Math.random() < 0.08) {
                vowels[i] = vowels[i] + vowels[i];
            }
        }
        var femaleSuffix = "";
        if (this.sex == "female") {
            femaleSuffix = VOWELS_WITH_FREQ[Math.floor(Math.random() * VOWELS_WITH_FREQ.length)];
        }
        return consonants[0] + vowels[0].toLowerCase() + consonants[1].toLowerCase() +
            vowels[1].toLowerCase() + consonants[2].toLowerCase() + femaleSuffix.toLowerCase();
    },

    generateSurname: function(father, mother) {
        if (!this.exists) {
            return "";
        }
        if (father == undefined || mother == undefined) {
            return "";
        }
        var fathersName = this.sex == "male";
        if (Math.random() < 0.1) {
            fathersName = !fathersName;
        }
        if ((fathersName && father.surname == "") || (!fathersName && mother.surname == "") || Math.random < 0.05) {
            var suffix = SURNAME_SUFFIXES[Math.floor(Math.random() * SURNAME_SUFFIXES.length)];
            if (fathersName) {
                if (father.name[father.name.length - 1] == suffix[0]) {
                    suffix = suffix.substring(1);
                }
                return father.name + suffix;
            } else {
                if (mother.name[mother.name.length - 1] == suffix[0]) {
                    suffix = suffix.substring(1);
                }
                return mother.name + suffix;
            }
        } else if (fathersName) {
            return father.surname;
        } else {
            return mother.surname;
        }
    }
}
