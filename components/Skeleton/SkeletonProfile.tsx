import React from "react";
import styles from "./Skeleton.module.css";

type Props = {
  width?: string;
  height?: string;
};

export default function SkeletonProfile({ height = "45px", width = "45px" }: Props) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "50%", // Ensure it's circular
      }}
      className={styles.SkeletonProfile}
    />
  );
}
