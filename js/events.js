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

var chances = [];
var currentDelta = 0;

function activateEvent(delta, person) {
    currentDelta = delta;
    for (var i = 0; i < chances.length; i++) {
        if (roll(chances[i][0](person))) {
            chances[i][1](person);
        }
    }
}

function roll(chance) {
    return Math.random() < getChance(chance);
}

function getChance(chance) {
    return chance * currentDelta;
}

/* Example:
 *  chances.push([function() {
 *      return x
 *  }, function() {
 *      y
 *  }]);
 * where x is the chance of this happening during a second (ie. if you want
 *  something to happen roughly every 10 seconds, put this to 0.1, or if you
 *  want something to happen roughly every tenth of a second, put this to 10)
 * and y is the body of the function you want to run
 */

// Chance of a baby being born
chances.push([function(person) {
    if (!person.inRelationshipWith.exists) {
        return 0;
    }
    if (person.sex == person.inRelationshipWith.sex) {
        return 0;
    }
    if (person.age < WORKING_AGE || person.inRelationshipWith.age < WORKING_AGE ||
        person.age > ELDER_AGE || person.age > ELDER_AGE) {
        return 0;
    }
    if (person.house == -1) {
        return 0;
    }
    return 0.02;
}, function(person) {
    var father, mother;
    if (person.sex == "male") {
        father = person;
        mother = person.inRelationshipWith;
    } else {
        father = person.inRelationshipWith;
        mother = person;
    }
    makePerson(father, mother);
}]);

// Chance of death
chances.push([function(person) {
    var ageDeath = Math.pow(Math.min(person.age, ELDER_AGE) / (ELDER_AGE + 1.0), 8);
    var hungerDeath = Math.pow(person.hunger / MAX_HUNGER_LEVEL, 4);
    return ageDeath + hungerDeath - (ageDeath * hungerDeath);
}, function(person) {
    historyEntries.push(person.getName() + " died.");
    person.exists = false;
    removePerson(person);
}]);

// Chance of two people getting in a relationship
chances.push([function(person) {
    return 0.2;
}, function(person) {
    /*
     * This function prevents incestuous relationships (which are still probable,
     *  but *very* rare.) It checks the following:
     *  - Is person0 the same person as person1
     *  - Is either of the persons the other one's parent
     *  - Do the persons have parents*, if yes, are they brothers/sisters
     *
     *  * The first people that come to life "don't have parents".
     */
    function isRelative(person0, person1) {
        var siblings = person0.father == person1.father || person0.mother == person1.mother;
        var isParent = person0 == person1.father || person0 == person1.mother;
        var isChild = person0.father == person1 || person0.mother == person1;
        return siblings && isParent && isChild;
    }
    for (var j = 0; j < people.length; j++) {
        var person1 = people[j];
        // Assign all "blockers"
        // True if person0 and person1 are the same person (or the person is very confident in him/herself)
        var selfCheck = person == person1 && Math.random() > Math.pow(person.confidence,
                (person.sexuality == "same" || person.sexuality == "any") ? 8 : 16);
        // True if person0 is a close relative to person1
        var relativeCheck = isRelative(person, person1);
        // True if person is too young
        var ageCheck = person.age < WORKING_AGE || person1.age < WORKING_AGE;
        var affairCheck = person.inRelationshipWith.exists || person1.inRelationshipWith.exists;
        // Roll dice & then roll the override-dice, because love conquers all "blockers"!
        if (Math.random() < 0.2 && ((Math.random() < 0.0005) || !(selfCheck ||
                relativeCheck || ageCheck || affairCheck))) {
            if ((person == person1) || (person.sex == person1.sex &&
                    (person.sexuality == "any" || person.sexuality == "same") &&
                    (person1.sexuality == "any" || person1.sexuality == "same")) ||
                    (person.sex != person1.sex &&
                    (person.sexuality == "any" || person.sexuality == "opposite") &&
                    (person1.sexuality == "any" || person1.sexuality == "opposite"))) {
                if (Math.random() < 0.5) {
                    person.getInRelationShipWith(person1);
                    person1.getInRelationShipWith(person);
                } else {
                    person1.getInRelationShipWith(person);
                    person.getInRelationShipWith(person1);
                }
                historyEntries.push(person.getName() + " and " + person1.getName() + " are now in a relationship!");
                return;
            }
        }
    }
}]);
