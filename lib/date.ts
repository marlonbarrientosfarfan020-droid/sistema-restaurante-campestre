export function fechaPeru() {

  return new Date(
    new Date().toLocaleString(
      "en-US",
      {
        timeZone: "America/Lima",
      }
    )
  );

}