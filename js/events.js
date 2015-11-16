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
    historyEntries.push(person.getName() + " died!");
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
    function isNotRelative(person0, person1) {
        // TODO: REMAKE THIS HORRIBLE LINE DEAR LORD
        return (Math.random() < Math.pow(person0.confidence, 16) && person0 == person1) || (person0 != person1 && (Math.random() < 0.01 || (person0.father != person1 && person0.mother != person1 && ((person0.father.exists && person1.father.exists && person0.father!= person1.father && person0.mother != person1.mother) || (!person0.father.exists || !person1.father.exists)))));
    }

    if (person.inRelationshipWith.exists) {
        return;
    }
    for (var j = 0; j < people.length; j++) {
        var person1 = people[j];
        if (isNotRelative(person, person1) && isNotRelative(person1, person) &&
                person.age > WORKING_AGE && person1.age > WORKING_AGE &&
                !person1.inRelationshipWith.exists && Math.random() < 0.2) {
            if ((person.sex == person1.sex &&
                    (person.sexuality == "any" || person.sexuality == "same") &&
                    (person1.sexuality == "any" || person1.sexuality == "same")) ||
                    (person.sex != person1.sex &&
                    (person.sexuality == "any" || person.sexuality == "opposite") &&
                    (person1.sexuality == "any" || person1.sexuality == "opposite"))) {
                person.getInRelationShipWith(person1);
                person1.getInRelationShipWith(person);
                historyEntries.push(person.getName() + " and " + person1.getName() + " are now in a relationship!");
                return;
            }
        }
    }
}]);
