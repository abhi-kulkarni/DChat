import React from "react";
import PropTypes from "prop-types";
import AnimationCounter from "./animation_counter.js";

const styles = {
  container: {
    position: "absolute",
    height: "100%",
    paddingLeft: "28px",
  },

  badge: {
    WebkitTransition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms",
    MozTransition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms",
    msTransition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms",
    transition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms",
    display: "inline-block",
    position: "absolute",
    minWidth: "10px",
    padding: "3px 7px",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1",
    color: "#fff",
    textAlign: "center",
    whiteSpace: "nowrap",
    verticalAlign: "baseline",
    backgroundColor: "rgba(212, 19, 13, 1)",
    borderRadius: "10px",
    top: "-28px",
    right: "-38px",
  },
};

class CustomBadge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    if (this.props.message_count) {
      this.props.style.top = "7px";
      this.props.style.right = "0px";
      delete this.props.style["position"];
      delete this.props.containerStyle["position"];
      this.props.containerStyle.paddingLeft = "38px";
    }else {
      this.props.style.position = "absolute";
      this.props.containerStyle.position = "absolute";
      this.props.style.fontSize = "0.7rem",
      this.props.style.padding = "3px 6px",
      this.props.count > 10?this.props.style.right = "4px":this.props.style.right = "7px"
      this.props.style.top = "-30px"            
    }
    const badgeStyle = this.merge(styles.badge, this.props.style);
    let container_styles = styles.container;
    const containerStyle = this.merge(
      container_styles,
      this.props.containerStyle
    );
    const value =
      this.props.count > 0 ? (
        <AnimationCounter
          key="badgekey"
          style={badgeStyle}
          className={this.props.className}
          count={this.props.count > 10 ? "10+" : this.props.count}
          label={this.props.label}
          effect={this.props.effect}
          fps={this.props.fps}
          frameLength={this.props.frameLength}
        />
      ) : undefined;

    return <div style={containerStyle}>{value}</div>;
  }

  merge(obj1, obj2) {
    const obj = {};
    for (const attrname1 in obj1) {
      if (obj1.hasOwnProperty(attrname1)) {
        obj[attrname1] = obj1[attrname1];
      }
    }
    for (const attrname2 in obj2) {
      if (obj2.hasOwnProperty(attrname2)) {
        obj[attrname2] = obj2[attrname2];
      }
    }
    return obj;
  }
}

CustomBadge.propTypes = {
  containerStyle: PropTypes.object,
  count: PropTypes.number,
  label: PropTypes.string,
  style: PropTypes.object,
  className: PropTypes.string,
  effect: PropTypes.array,
  fps: PropTypes.number,
  frameLength: PropTypes.number,
};

CustomBadge.defaultProps = {
  count: 0,
  style: {},
  containerStyle: {},
};

export default CustomBadge;
