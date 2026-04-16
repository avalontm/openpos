import React from "react";

export function useTerminalSize() {
	const [cols, setCols] = React.useState(() => process.stdout.columns || 80);
	const [rows, setRows] = React.useState(() => process.stdout.rows || 24);

	React.useEffect(() => {
		const handleResize = () => {
			setCols(process.stdout.columns || 80);
			setRows(process.stdout.rows || 24);
		};

		process.stdout.on("resize", handleResize);
		
		const interval = setInterval(handleResize, 500);

		return () => {
			process.stdout.off("resize", handleResize);
			clearInterval(interval);
		};
	}, []);

	return { cols, rows };
}