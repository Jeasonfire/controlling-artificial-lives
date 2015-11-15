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

function activateEvents(delta) {
    currentDelta = delta;
    for (var i = 0; i < chances.length; i++) {
        if (roll(chances[i][0]())) {
            chances[i][1]();
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

// Chance of two people getting in a relationship
chances.push([function() {
    return 0.2;
}, function() {
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
        return person0 != person1 && (Math.random() < 0.01 || (person0.father != person1 && person0.mother != person1 &&
            ((person0.father.exists && person1.father.exists && person0.father != person1.father && person0.mother != person1.mother) ||
            (!person0.father.exists || !person1.father.exists))));
    }

    for (var i = 0; i < people.length; i++) {
        var person0 = people[i];
        if (person0.inRelationshipWith.exists) {
            continue;
        }
        for (var j = 0; j < people.length; j++) {
            var person1 = people[j];
            if (isNotRelative(person0, person1) && isNotRelative(person1, person0) &&
                    !person1.inRelationshipWith.exists && Math.random() < 0.2) {
                if ((person0.sex == person1.sex &&
                        (person0.sexuality == "any" || person0.sexuality == "same") &&
                        (person1.sexuality == "any" || person1.sexuality == "same")) ||
                        (person0.sex != person1.sex &&
                        (person0.sexuality == "any" || person0.sexuality == "opposite") &&
                        (person1.sexuality == "any" || person1.sexuality == "opposite"))) {
                    person0.inRelationshipWith = person1;
                    person1.inRelationshipWith = person0;
                    historyEntries.push(person0.getName() + " and " + person1.getName() + " are now in a relationship!");
                    return;
                }
            }
        }
    }
}]);
