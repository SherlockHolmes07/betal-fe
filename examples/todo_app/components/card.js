import { defineComponent, h, hSlot } from "betal-fe";

// A Card component that uses slots for flexible content
export const Card = defineComponent({
  render() {
    const { title, variant = "default" } = this.props;
    
    const cardStyles = {
      default: { 
        background: "white", 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        padding: "15px", 
        margin: "10px 0" 
      },
      success: { 
        background: "#d4edda", 
        border: "1px solid #c3e6cb", 
        borderRadius: "8px", 
        padding: "15px", 
        margin: "10px 0" 
      },
      warning: { 
        background: "#fff3cd", 
        border: "1px solid #ffeaa7", 
        borderRadius: "8px", 
        padding: "15px", 
        margin: "10px 0" 
      },
    };

    return h("div", { style: cardStyles[variant] }, [
      h("h3", { style: { margin: "0 0 10px 0", color: "#333" } }, [title]),
      h("div", { style: { color: "#666" } }, [
        hSlot([h("p", {}, ["Default slot content"])])
      ])
    ]);
  }
});
