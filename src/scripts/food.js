var short = [
    ['1.1', 'grain based baked'],
    ['1.2', 'grain free baked'],
    ['2.1.1', 'beer'],
    ['2.1.2', 'distilled'],
    ['2.1.3', 'liquor'],
    ['2.1.4', 'wine'],
    ['2', 'cereal grains and pasta'],
    ['4.1', 'dairy'],
    ['4.2', 'egg'],
    ['5', 'fats and oils'],
    ['6', 'fish and shellfish'],
    ['7', 'fruit and juices'],
    ['8', 'legumes'],
    ['9.1', 'beef'],
    ['9.2', 'pork'],
    ['9.3.1', 'chicken'],
    ['9.3.2', 'turkey'],
    ['9.3.3', 'duck'],
    ['9.3.4', 'goose'],
    ['9.4', 'lamb'],
    ['9.5', 'game'],
    ['10', 'nuts and seeds'],
    ['11', 'spices and herbs'],
    ['12', 'vegetables']
];

var categories = {
    1: {
        name: 'baked products',
        sub: {
            1: {
                name: 'grain based baked products',
                paleo: false
            },
            2: {
                name: 'grain free baked products'
            }
        }
    },
    2: {
        name: 'beverages',
        sub: {
            1: {
                name: 'alcoholic',
                paleo: false,
                sub: {
                    1: {
                        name: 'beer'
                    },
                    2: {
                        name: 'distilled'
                    },
                    3: {
                        name: 'liquor'
                    },
                    4: {
                        name: 'wine'
                    }
                }
            },
            2: {
                name: 'coffee'
            },
            3: {
                name: 'tea'
            }
        }
    },
    3: {
        name: 'cereal grains and pasta',
        paleo: false
    },
    4: {
        name: 'dairy and egg',
        sub: {
            1: {
                name: 'dairy',
                paleo: false
            },
            2: {
                name: 'egg'
            }
        }
    },
    5: {
        name: 'fats and oils'
    },
    6: {
        name: 'fish and shellfish'
    },
    7: {
        name: 'fruits and juices'
    },
    8: {
        name: 'legumes',
        paleo: false
    },
    9: {
        name: 'meat',
        sub: {
            1: {
                name: 'beef'
            },
            2: {
                name: 'pork'
            },
            3: {
                name: 'poultry',
                sub: {
                    1: {
                        name: 'chicken'
                    },
                    2: {
                        name: 'turkey'
                    },
                    3: {
                        name: 'duck'
                    },
                    4: {
                        name: 'goose'
                    }
                }
            },
            4: {
                name: 'lamb'
            },
            5: {
                name: 'game'
            }
        }
    },
    10: {
        name: 'nuts and seeds'
    },
    11: {
        name: 'spices and herbs'
    },
    12: {
        name: 'vegetables'
    }
};

module.exports = {
    categories: categories,
    short: short
};