import { useEffect } from "react";
import { useNavigation } from "react-router";
import { NavigationProgress, nprogress } from "@mantine/nprogress";

export function NavigationProgressBar() {
	const navigation = useNavigation();

	useEffect(() => {
		// When navigation state changes
		if (navigation.state === "loading") {
			// Start the progress bar when navigation starts
			nprogress.start();
		} else if (navigation.state === "idle") {
			// Complete the progress bar when navigation finishes
			nprogress.complete();
		}
	}, [navigation.state]);

	return <NavigationProgress />;
}
