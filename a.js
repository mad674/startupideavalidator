// Mock functions
function getFlights() {
  return Promise.resolve([{ id: 123, name: "Flight 123" }]);
}

function getSeatMap(flightId) {
  return Promise.resolve(["1A", "1B", "1C"]);
}

// Main logic
getFlights()
  .then((flights) => {
    if (!flights || flights.length === 0) {
      return Promise.reject("No flights available");
    }
    const flight = flights[0];
    return getSeatMap(flight.id).then((seats) => {
      console.log(`Seat Map for Flight #${flight.id}:`, seats);
    });
  })
  .catch((err) => console.error(err));
