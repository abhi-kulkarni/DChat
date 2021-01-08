import { withOrientationChange } from "react-device-detect";
import React from "react";

let Orientation = (props) => {
  const { isLandscape, isPortrait } = props;
  if (isLandscape) {
    props.getData("landscape");
  } else if (isPortrait) {
    props.getData("portrait");
  }
  return "";
};

Orientation = withOrientationChange(Orientation);

export { Orientation };
