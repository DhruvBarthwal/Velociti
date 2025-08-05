import React from 'react'
import { FaMicrophone } from "react-icons/fa";
const MyCustomMicrophone = ({className, color='currentColour'}) => {
  return (
    <FaMicrophone className={className} style={{color:color}}/>
  );
}

export default MyCustomMicrophone