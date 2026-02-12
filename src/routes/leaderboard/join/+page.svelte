<h2 style="text-align: center;">Enter the leaderboard code</h2>
<form method="POST">
    <input type="text" name="id" placeholder="Leaderboard code" required>
    <button type="submit">Join</button>
</form>
<br>
<p>You can also ask the leaderboard host for the QR code.</p>

<style>
    form {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 1rem;
    }

    p {
        text-align: center;
    }

    @media only screen and (max-width: 600px) {
        form {
            flex-direction: column;
            align-items: center;
        }
    }
</style>