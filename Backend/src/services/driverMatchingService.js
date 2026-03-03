const Driver = require("../models/Driver");

// simple distance formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  return Math.sqrt(
    Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)
  );
};

const findNearestDriver = async (pickupLocation) => {
  const drivers = await Driver.find({ isAvailable: true });

  if (!drivers.length) return null;

  let nearestDriver = drivers[0];
  let minDistance = calculateDistance(
    pickupLocation.lat,
    pickupLocation.lng,
    drivers[0].location.lat,
    drivers[0].location.lng
  );

  for (let driver of drivers) {
    const distance = calculateDistance(
      pickupLocation.lat,
      pickupLocation.lng,
      driver.location.lat,
      driver.location.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestDriver = driver;
    }
  }

  return nearestDriver;
};

module.exports = { findNearestDriver };